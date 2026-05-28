package metrics

import (
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
	"github.com/shirou/gopsutil/v4/net"
)

// Snapshot is a point in time read of system metrics.
// Field names match web/lib/types.ts → MetricsPayload exactly.
type Snapshot struct {
	CPU             float64   `json:"cpu"`
	CPUCores        []float64 `json:"cpuCores"`
	CPUTemp         float64   `json:"cpuTemp"`
	RAM             float64   `json:"ram"`
	RAMUsed         uint64    `json:"ramUsed"`
	RAMTotal        uint64    `json:"ramTotal"`
	DiskUsed        uint64    `json:"diskUsed"`
	DiskTotal       uint64    `json:"diskTotal"`
	DiskPercent     float64   `json:"diskPercent"`
	NetBytesSent    uint64    `json:"netBytesSent"`
	NetBytesRecv    uint64    `json:"netBytesRecv"`
	NetSentPerSec   uint64    `json:"netSentPerSec"`
	NetRecvPerSec   uint64    `json:"netRecvPerSec"`
	Uptime          uint64    `json:"uptime"`
	TimestampMillis int64     `json:"timestampMillis"`
}

// prevNetSent and prevNetRecv track the last tick's network counters
// so we can compute per-second deltas instead of cumulative totals.
var (
	prevNetSent uint64
	prevNetRecv uint64
)

func Collect() (*Snapshot, error) {
	// 0 = diff against gopsutil's cached previous reading instead of sleeping.
	// false = return one aggregate value across all cores, not per-core.
	cpuPercents, err := cpu.Percent(0, false)
	if err != nil {
		return nil, err
	}

	// per-core breakdown
	cpuCores, err := cpu.Percent(0, true)
	if err != nil {
		cpuCores = []float64{}
	}

	vmStat, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	// disk usage for root partition
	diskStat, err := disk.Usage("/")
	if err != nil {
		return nil, err
	}

	// network I/O counters — aggregate across all interfaces
	netStats, err := net.IOCounters(false)
	if err != nil {
		return nil, err
	}

	var netSentPerSec, netRecvPerSec uint64
	if len(netStats) > 0 {
		currentSent := netStats[0].BytesSent
		currentRecv := netStats[0].BytesRecv

		if prevNetSent > 0 {
			netSentPerSec = currentSent - prevNetSent
			netRecvPerSec = currentRecv - prevNetRecv
		}

		prevNetSent = currentSent
		prevNetRecv = currentRecv
	}

	uptimeSecs, err := host.Uptime()
	if err != nil {
		return nil, err
	}

	return &Snapshot{
		CPU:             cpuPercents[0],
		CPUCores:        cpuCores,
		RAM:             vmStat.UsedPercent,
		RAMUsed:         vmStat.Used,
		RAMTotal:        vmStat.Total,
		DiskUsed:        diskStat.Used,
		DiskTotal:       diskStat.Total,
		DiskPercent:     diskStat.UsedPercent,
		NetBytesSent:    netStats[0].BytesSent,
		NetBytesRecv:    netStats[0].BytesRecv,
		NetSentPerSec:   netSentPerSec,
		NetRecvPerSec:   netRecvPerSec,
		Uptime:          uptimeSecs,
		TimestampMillis: time.Now().UnixMilli(),
	}, nil
}
