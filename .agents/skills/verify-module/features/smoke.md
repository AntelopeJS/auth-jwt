---
covers:
docs:
  - README.md
journeys:
  - module-dev
  - secret-roundtrip
---

# Smoke

The fixed journey every verdict runs: load the module as `local` next to the API module, sign an object and validate it back.

## Sub-features

- `module-dev` replaces the pack's journey of the same id, because the module needs the API module: the project answers, the consumer loads the auth interface (`/surface`), Ctrl+C exits 130 and both the driver port and the API port refuse afterwards.
- `secret-roundtrip`: one object signed and validated, as in [secret](secret.md).

## How to get to it (user POV)

- A project with `@antelopejs/auth-jwt` and `@antelopejs/api`, and a module that imports `@antelopejs/interface-auth`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" smoke
```

## Gotchas

- The smoke feature covers no glob, so it never marks a file as mapped.
