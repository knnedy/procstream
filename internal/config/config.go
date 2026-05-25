package config

import (
	"flag"
	"fmt"
	"time"
)

// Config holds every runtime values for the app.
type Config struct {
	// Host is the network interface to bind to.
	// "0.0.0.0" means all interfaces - the server will be reachable
	// from other devices from the same LAN, "127.0.0.1" restricts to
	// localhost only
	Host string

	// Port is the TCP port the HTTP + WebSocket server listens on.
	Port int

	// Interval controls how often the metrics goroutine scrapes the
	// system and broadcasts a new payload to all connected clients.
	// Lower = more responsive UI, but slightly higher CPU cost.
	Interval time.Duration
}

// Addr returns the full "host:port" string ready to pass to http.ListenAndServe.
func (c *Config) Addr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// Parse reads os.Args, populates and returns a Config.
func Parse() *Config {
	cfg := &Config{}

	// flag.StringVar registers a string flag.
	flag.StringVar(
		&cfg.Host,
		"host",
		"0.0.0.0",
		"network interface to bind (0.0.0.0 = all interfaces, LAN-visible)",
	)

	flag.IntVar(
		&cfg.Port,
		"port",
		8080,
		"TCP port for the HTTP server and WebSocket endpoint",
	)

	flag.DurationVar(
		&cfg.Interval,
		"interval",
		500*time.Millisecond,
		"metrics scrape and broadcast interval (e.g. 250ms, 500ms, 1s)",
	)

	// flag.Parse() reads os.Args[1:] and fills in all registered variables.
	flag.Parse()

	return cfg
}
