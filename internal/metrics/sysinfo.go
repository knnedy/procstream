package metrics

import (
	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/host"
)

// SystemInfo holds static system information sent once when a client connects.
// Field names match web/lib/types.ts → SystemInfo exactly.
type SystemInfo struct {
	Hostname string `json:"hostname"`
	OS       string `json:"os"`
	Platform string `json:"platform"`
	Kernel   string `json:"kernel"`
	CPUModel string `json:"cpuModel"`
	CPUCores int    `json:"cpuCores"`
}

// CollectSystemInfo scrapes static system information.
// Call once at startup and cache the result — these values never change.
func CollectSystemInfo() (*SystemInfo, error) {
	hostInfo, err := host.Info()
	if err != nil {
		return nil, err
	}

	cpuInfo, err := cpu.Info()
	if err != nil {
		return nil, err
	}

	cpuModel := "unknown"
	cpuCores := 0
	if len(cpuInfo) > 0 {
		cpuModel = cpuInfo[0].ModelName
		cpuCores = int(cpuInfo[0].Cores)
	}

	return &SystemInfo{
		Hostname: hostInfo.Hostname,
		OS:       hostInfo.OS,
		Platform: hostInfo.Platform,
		Kernel:   hostInfo.KernelVersion,
		CPUModel: cpuModel,
		CPUCores: cpuCores,
	}, nil
}
