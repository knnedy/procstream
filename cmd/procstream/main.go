package main

import (
	"io/fs"
	"log"
	"mime"
	"net/http"

	"github.com/knnedy/procstream/internal/config"
	"github.com/knnedy/procstream/internal/proc"
	"github.com/knnedy/procstream/internal/ws"
)

func init() {
	mime.AddExtensionType(".js", "application/javascript")
	mime.AddExtensionType(".css", "text/css")
	mime.AddExtensionType(".woff2", "font/woff2")
	mime.AddExtensionType(".woff", "font/woff")
	mime.AddExtensionType(".ttf", "font/ttf")
	mime.AddExtensionType(".svg", "image/svg+xml")
	mime.AddExtensionType(".ico", "image/x-icon")
	mime.AddExtensionType(".json", "application/json")
	mime.AddExtensionType(".txt", "text/plain")
	mime.AddExtensionType(".html", "text/html")
	mime.AddExtensionType(".png", "image/png")
}

func main() {
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

	log.Printf("ProcStream → http://%s", cfg.Addr())
	log.Printf("running as UID %d", proc.CurrentUID())

	if err := http.ListenAndServe(cfg.Addr(), mux); err != nil {
		log.Fatal(err)
	}
}
