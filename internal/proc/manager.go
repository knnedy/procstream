package proc

import (
	"fmt"
	"os"
	"os/user"
	"strconv"

	"github.com/shirou/gopsutil/v4/process"
)

// Entry represents a single process in the websocket payload.
// Field names match we/lib/types.ts -> ProcessEntry exaxctly.
type Entry struct {
	PID     int32   `json:"pid"`
	Name    string  `json:"name"`
	CPU     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`
	Owner   string  `json:"owner"`
	CanKill bool    `json:"canKill"`
}

// captured once at startup - th UID of the user who launched procstream.
var currentUID = os.Getuid()

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

// KillResult is returned to the frontend after a kill attempt
// Matches web/lib/types.ts -> KillResponse exactly
type KillResult struct {
	PID     int32  `json:"pid"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// Kill sends SIGTERM to the given PID after verifying UID ownership
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
		return KillResult{PID: pid, Success: false, Error: fmt.Sprintf("FindProcess failed: %v")}
	}

	if err := osProc.Signal(os.Interrupt); err != nil {
		return KillResult{PID: pid, Success: false, Error: fmt.Sprintf("signal failed: %v")}
	}

	return KillResult{PID: pid, Success: true}
}
