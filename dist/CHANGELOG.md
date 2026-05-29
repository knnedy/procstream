## Changelog
### Features
* 6f0bef92197700d8def32216e8e448069f436630 feat(cmd): add -version flag populated at build time via ldflags
* 5db725d1aa3203e450a90c9de91a82f236e5bf36 feat(cmd): add main entrypoint
* 261ca48a24da36030ce8d403abd91b0d414b2fc0 feat(config): add CLI flag parsing
* 59d617bb66d64261f4b8a14382015efb79ea1abb feat(hooks): add useMetrics WebSocket hook with exponential backoff reconnect
* 9fac58944a2f0cf6519ec0651658fb3f0715d24f feat(hooks): handle init message for system info alongside metrics payload
* ef6a9dca2610c9d7d8e38614f6d1aba43589e055 feat(lib): add formatting and severity utility functions
* f8765c085c4613352cbd0f1da82608124da26339 feat(lib): add shared TypeScript types matching Go JSON contracts
* a262e2f3a0e1877a9c8f64bfe6a3002c500fac04 feat(metrics): add per-core CPU, disk usage and network I/O delta, remove temperature
* 5638f680af2e9354024f91ad745008486ec98b38 feat(metrics): add static system info collector for hostname, OS, kernel and CPU model
* 20c0cc29b0ebc9fc5f05b8d1ff3983fffbe10f4e feat(metrics): add system metrics collector
* 75b2e98b7ac5228e77ed73ba160c6b3c491c4ebb feat(proc): add process listing and kill manager
* 6399e721bc521cd0a61a42c48702ea6a8f14fe2e feat(proc): export CurrentUID and add HandleKill HTTP handler
* d3359ff3990b82a0aaa99f40ba1b7fd8f19a1e0c feat(process_table): add kill process confirmation modal
* 69047cd76721e745c58a7f52ee42983a1d681964 feat(types): add SystemInfo, InitMessage, network, disk and per-core CPU fields
* b3974fb8e47c7c8c76da48c17d4576a2bc1eeb82 feat(utils): add utility functions for tailwindcss classname merging
* c28c3d47a3fa72f1101076d5b5c1b8f060228f92 feat(web): add 60s dual metric timeline chart with custom tooltip and legend
* bfa58d95143790faa06978987f4299b33a34ce4d feat(web): add MetricGauge with animated ring and sparkline
* 1f0695892dcf4d61b8c8ae1d74d4ffbcf07b8a1f feat(web): add dashboard page with gauges, timeline and process table
* a71557770669ad11f35c0c8ddefc4e173738a3ac feat(web): add reconnect banner for websocket connection status
* ca2d6dcaee8a9902f73aa99eb2e51656006daa99 feat(web): add theme provider and toggle with dark mode as default
* 14b36a35960207a030b39dfe7e94cd5c4dc02056 feat(web): add virtualised process table with sorting, filtering and optimistic kill
* e4a5c67f91371c6e2a78daa9f8affa77d8a42fec feat(web): configure Next.js for static export
* 1a24fa3ee308a57fc6416744e8ae8a275885baea feat(web): update layout with ProcStream metadata and design token classes
* 5056b4e21d1544551155d5719548e5ebfa929bbe feat(ws): add WebSocket hub with metrics broadcast
* 51cb5a856de72990146b0ab2d931ba5625795b12 feat(ws): send static system info on client connect, cache in hub
* 7f511bc65c2370c2cb67161a1e81e5ecfe46c07c feat: add tabs to homepage to separate concerns
### Bug Fixes
* c29273385ed6b61896c831d4a0c939c32f8d4c74 fix(build): fix go embed and add file mime types to main.go
* ed9733a1980ae7bfd8fe1e8c0418818ae89c0e3f fix(build): output binary to bin/ to avoid name collision with project root gitignore
* ecf06ca99d5b49b68b88a7e5ad6184ed75612072 fix(goreleaser): remove duplicate hooks key
* 9b3b5e0a9a910c356cd5e1342c7bc1bf4ae85eb8 fix(goreleaser): wrap frontend build hook in sh -c to allow cd
* 0d53b9ef7d80ac912639c0272813ec8b083ce109 fix(metrics): use cpu.Counts(true) for logical core count to match per-core breakdown
* afbfc1e656e1449dfa47fef55cb58d91fd803288 fix(proc): pass error messages in Kill function error fmt.sprintf
* 6aa5f83f59f03e189d162ad5842d1973331a2e14 fix(proc): replace SIGINT with SIGTERM+SIGKILL escalation and kill process group for multi-process apps
* 765c6ec8a59aa3ad666b50deb129545680fd24ca fix: user tasks switched to show the checked state
