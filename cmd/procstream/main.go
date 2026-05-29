package main

import (
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/knnedy/procstream/internal/config"
	"github.com/knnedy/procstream/internal/proc"
	"github.com/knnedy/procstream/internal/ws"
)

// Version is set at build time by GoReleaser via -ldflags.
// Falls back to "dev" when built without GoReleaser.
var Version = "dev"

func main() {
	// handle -version before flag.Parse so it works without any other flags
	if len(os.Args) > 1 && os.Args[1] == "-version" {
		fmt.Printf("procstream %s\n", Version)
		os.Exit(0)
	}

	cfg := config.Parse()

	hub := ws.NewHub(cfg.Interval)
	go hub.Run()

	subFS, err := fs.Sub(staticFiles, "out")
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.FS(subFS)))
	mux.HandleFunc("/ws", hub.ServeWS)
	mux.HandleFunc("/kill", proc.HandleKill)

	log.Printf("ProcStream %s → http://%s", Version, cfg.Addr())
	log.Printf("running as UID %d", proc.CurrentUID())

	if err := http.ListenAndServe(cfg.Addr(), mux); err != nil {
		log.Fatal(err)
	}
}
