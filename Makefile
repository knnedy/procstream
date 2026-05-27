.PHONY: build clean run

build: web-build go-build

web-build:
	cd web && pnpm install && pnpm run build
	@test -f web/out/index.html || \
		(echo "ERROR: web/out/index.html not found. Frontend build failed." && exit 1)
	rm -rf cmd/procstream/out
	cp -r web/out cmd/procstream/out

go-build: web-build
	go build -o procstream ./cmd/procstream

run: build
	./procstream

clean:
	rm -rf web/out web/.next procstream cmd/procstream/out