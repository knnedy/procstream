package proc

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/user"
	"strconv"
	"syscall"
	"time"

	"github.com/shirou/gopsutil/v4/process"
)

// Entry represents a single process in the websocket payload.
// Field names match web/lib/types.ts -> ProcessEntry exactly.
type Entry struct {
	PID     int32   `json:"pid"`
	Name    string  `json:"name"`
	CPU     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`
	Owner   string  `json:"owner"`
	CanKill bool    `json:"canKill"`
}

// captured once at startup - the UID of the user who launched procstream.
var currentUID = os.Getuid()

// CurrentUID exposes the server process UID for logging in main.go.
func CurrentUID() int {
	return currentUID
}

// List returns all running processes with CanKill set based on UID ownership
func List() ([]Entry, error) {
	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

	entries := make([]Entry, 0, len(procs))

	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			// process exited between listing and reading - skip it
			continue
		}

		// returns usage since last call, safe in a 500ms loop
		cpuPct, err := p.CPUPercent()
		if err != nil {
			cpuPct = 0
		}

		memPct, err := p.MemoryPercent()
		if err != nil {
			memPct = 0
		}

		// Uids() returns [real, effective, saved, filesystem].
		// Check index 0 (real UID) - the actual owner of the process
		uids, err := p.Uids()
		ownerUID := -1
		ownerName := "unknown"
		if err == nil && len(uids) > 0 {
			ownerUID = int(uids[0])
			if u, err := user.LookupId(strconv.Itoa(ownerUID)); err == nil {
				ownerName = u.Username
			}
		}

		entries = append(entries, Entry{
			PID:    p.Pid,
			Name:   name,
			CPU:    cpuPct,
			Memory: float64(memPct),
			Owner:  ownerName,
			// UID 0 is root - never allow killing system processes
			CanKill: ownerUID == currentUID && ownerUID != 0,
		})
	}

	return entries, nil
}

// KillResult is returned to the frontend after a kill attempt.
// Matches web/lib/types.ts -> KillResponse exactly.
type KillResult struct {
	PID     int32  `json:"pid"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// Kill terminates the given PID after verifying UID ownership.
// Strategy: SIGTERM first (graceful), escalate to SIGKILL after 3s if still alive.
// For multi-process apps like Chrome, we also kill the entire process group.
func Kill(pid int32) KillResult {
	p, err := process.NewProcess(pid)
	if err != nil {
		return KillResult{PID: pid, Success: false, Error: fmt.Sprintf("process not found: %v", err)}
	}

	uids, err := p.Uids()
	if err != nil || len(uids) == 0 {
		return KillResult{PID: pid, Success: false, Error: "could not determine process owner"}
	}

	if int(uids[0]) != currentUID || uids[0] == 0 {
		return KillResult{PID: pid, Success: false, Error: "permission denied"}
	}

	osProc, err := os.FindProcess(int(pid))
	if err != nil {
		return KillResult{PID: pid, Success: false, Error: fmt.Sprintf("FindProcess failed: %v", err)}
	}

	// SIGTERM — polite shutdown, gives the process a chance to clean up
	if err := osProc.Signal(syscall.SIGTERM); err != nil {
		// process may have already exited — treat as success
		if err == os.ErrProcessDone {
			return KillResult{PID: pid, Success: true}
		}
		return KillResult{PID: pid, Success: false, Error: fmt.Sprintf("SIGTERM failed: %v", err)}
	}

	// also kill the entire process group to catch child processes (e.g. Chrome tabs)
	// negative PID targets the process group leader
	syscall.Kill(-int(pid), syscall.SIGTERM)

	// wait up to 3 seconds for graceful exit, then SIGKILL
	for range 6 {
		time.Sleep(500 * time.Millisecond)
		if err := osProc.Signal(syscall.Signal(0)); err != nil {
			// signal 0 = check if process exists, error means it's gone
			return KillResult{PID: pid, Success: true}
		}
	}

	// process ignored SIGTERM — force kill
	osProc.Signal(syscall.SIGKILL)
	syscall.Kill(-int(pid), syscall.SIGKILL)

	return KillResult{PID: pid, Success: true}
}

// HandleKill is the HTTP handler for POST /kill.
func HandleKill(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		PID int32 `json:"pid"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	result := Kill(req.PID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
