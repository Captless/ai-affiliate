# AGENTS.md

## Architecture

- Keep frontend and backend modular. Do not create monolithic files.
- Organize code by feature/responsibility.
- UI components handle UI; services handle API/business communication.
- Backend routes stay thin; business logic belongs in backend services.
- Keep WaveSpeed-specific logic isolated in `backend/services/wavespeed_service.py`.
- API key selection logic lives only in `backend/services/api_key_service.py`.

## Development

- Read `AGENTS.md` and `codemap.md` before planning or implementing.
- For small tasks, inspect only relevant files.
- For larger tasks, make a plan before implementation.
- Avoid unrelated refactors.
- Reuse existing services/types instead of duplicating logic.
- Keep TypeScript strictly typed (`npx tsc --noEmit` must pass).
- Keep API keys and sensitive data out of frontend code.

## Documentation Workflow

After every implementation, check whether the architecture or file relationships materially changed.

- If nothing significant changed: do nothing.
- If `codemap.md` should change: tell the user why and ask before updating it.
- If `AGENTS.md` should change: tell the user why and ask before updating it.
- Never update either file just for minor bug fixes, styling changes, or small internal changes.

## Agent Workflow

```text
Read instructions
→ inspect relevant code
→ plan when necessary
→ implement
→ validate
→ check documentation impact
```

## Run / Validate

- Run: `py server.py` (binds 127.0.0.1, falls back past port 8000 if taken).
- Backend compile check: `python -m py_compile` on changed files.
- Frontend: `npx tsc --noEmit` and `npm run build`.
