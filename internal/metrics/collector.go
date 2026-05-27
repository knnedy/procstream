package metrics

import (
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
)

// Snapshot is a point in time read of system metrics
type Snapshot struct {
	CPU             float64 `json:"cpu"`
	RAM             float64 `json:"ram"`
	RAMUsed         uint64  `json:"ramUsed"`
	RAMTotal        uint64  `json:"ramTotal"`
	Uptime          uint64  `json:"uptime"`
	TimestampMillis int64   `json:"timestampMillis"`
}

// Collect scrapes a single system metrics snapshot.
// interval=0 tells gopsutils to diff against its cached previous
// /proc/stat read rather than sleeping
func Collect() (*Snapshot, error) {
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
