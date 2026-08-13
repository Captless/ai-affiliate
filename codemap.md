# codemap.md

Local-first web app (AI Affiliate Studio): generates Instagram fashion images via WaveSpeed Nano Banana 2. Vanilla TypeScript + Tailwind frontend; Python stdlib-only backend (http.server + sqlite3).

## Structure

```
server.py                      Thin entrypoint: boot, port fallback (8000-8019), worker start, router wiring
backend/
  api/                         Thin HTTP handlers (no business logic)
    routes.py                  Router, AppHandler, ctx helpers, static serving, /api/* dispatch
    reference_routes.py        /api/references (GET/POST/DELETE) + /{id}/file
    api_key_routes.py          /api/keys CRUD + /test + /balance
    generation_routes.py       /api/generate + /api/generations (list/get/delete/file)
    settings_routes.py         /api/settings (GET/PUT)
  services/                    Business logic + external/file/db access
    wavespeed_service.py       ALL WaveSpeed API calls (edit submit, poll, balance, upload)
    api_key_service.py         ALL key selection + CRUD + obfuscation/masking
    generation_service.py      Async job queue + worker thread, job state machine
    reference_service.py       Reference CRUD, storage, history pruning
    storage_service.py         File persistence helpers
    balance_service.py         Thin balance wrapper
    settings_service.py        Settings merge/whitelist
  models/                      Dataclasses + to_dict / public dicts (never expose raw keys)
  database/                    sqlite3 init (reference_images table), migrations framework
  utils/                       files (paths, size/mime guards, path-traversal safety), validation
web/
  index.html                   #app, #modals, #toasts mounts
  src/app.ts                   Boot, layout, polling loop, Escape handling, initial compose
  src/components/              Header, references/, generation/, prompt/, gallery/, api-keys/
  src/services/                api (fetch wrapper), referenceService, apiKeyService,
                               generationService, promptService (pose/style/buildPrompt)
  src/state/                   Generic Store pub/sub + app/reference/generation stores
  src/types/                   references, apiKeys, generation, settings, prompt
  src/utils/                   dom, formatting, validation, image, toast
  src/styles.css               Tailwind + custom editorial dark styling
scripts/build.mjs              esbuild bundle + tailwind CLI
data/app.db                    SQLite (gitignored)
storage/                       reference images + generation outputs (gitignored)
```

## Key relationships

- Routes → services → database / filesystem / WaveSpeed API. Route handlers stay thin; never call WaveSpeed directly.
- `generation_service` is the only caller of `wavespeed_service`; `api_key_service.select_key()` is the only key-selection path.
- Keys stored obfuscated server-side; only `masked` value ever reaches frontend. Frontend holds no secrets.
- Jobs: `POST /api/generate` returns 202 with job id; worker thread runs upload→submit→poll→download; frontend polls `GET /api/generations` every 2.5s while jobs are active.

## Data flows

- **Upload reference**: frontend multipart POST → reference_service validates (mime/size/path-safe) → saves file to `storage/references/{model|outfit}/`, prunes previous of same type → served via `/api/references/{id}/file`.
- **Generate**: prompt builder (refs + pose + style + user prompt + constraints) → submit → worker selects key → uploads both ref images to WaveSpeed → submits edit → polls → downloads output to `storage/outputs/generations/{id}/image.{ext}` → marks completed; failures mark key error + job failed.
- **API keys**: add (obfuscated) → test/balance hit WaveSpeed live → status/balance/last_error/last_success tracked; auto mode prefers primary healthy key.
- **Settings**: `key_selection` (auto|manual), `manual_key_id`, `open_browser`, `port` — merged over defaults.

## Conventions

- DB table is `reference_images` (`references` is reserved in SQLite).
- Handler signature: `(ctx, params, body)` — all handlers 3-arg.
- Validation errors → `ValidationError(message, status)`; unknown errors → 500 logged.
- Frontend state via typed stores; components subscribe + re-render.
