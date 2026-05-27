package metrics

import (
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
)

// Snapshot is a point in time read of system metrics
// Field names match web/lib/types.ts → MetricsPayload exactly.
type Snapshot struct {
	CPU             float64 `json:"cpu"`
	RAM             float64 `json:"ram"`
	RAMUsed         uint64  `json:"ramUsed"`
	RAMTotal        uint64  `json:"ramTotal"`
	Uptime          uint64  `json:"uptime"`
	TimestampMillis int64   `json:"timestampMillis"`
}

func Collect() (*Snapshot, error) {
	// 0 = diff against gopsutil's cached previous reading instead of sleeping.
	// false = return one aggregate value across all cores, not per-core.
	cpuPercents, err := cpu.Percent(0, false)
	if err != nil {
		return nil, err
	}

	vmStat, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	uptimeSecs, err := host.Uptime()
	if err != nil {
		return nil, err
	}

	return &Snapshot{
		CPU:             cpuPercents[0],
		RAM:             vmStat.UsedPercent,
		RAMUsed:         vmStat.Used,
		RAMTotal:        vmStat.Total,
		Uptime:          uptimeSecs,
		TimestampMillis: time.Now().UnixMilli(),
	}, nil
}
