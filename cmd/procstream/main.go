package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"

	"github.com/knnedy/procstream/internal/config"
	"github.com/knnedy/procstream/internal/proc"
	"github.com/knnedy/procstream/internal/ws"
)

// go:embed web/out
var staticFiles embed.FS

func main() {
	cfg := config.Parse()

	hub := ws.NewHub(cfg.Interval)
	go hub.Run()

	subFS, err := fs.Sub(staticFiles, "web/out")
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.FS(subFS)))
	mux.HandleFunc("/ws", hub.ServeWS)
	mux.HandleFunc("/kill", proc.HandleKill)

	log.Printf("ProcStream → http://%s", cfg.Addr())
	log.Printf("running as UID %d", proc.CurrentUID())

	if err := http.ListenAndServe(cfg.Addr(), mux); err != nil {
		log.Fatal(err)
	}
}
