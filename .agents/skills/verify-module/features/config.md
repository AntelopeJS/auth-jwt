---
covers:
  - src/index.ts
  - src/jwt.ts
docs:
  - README.md
journeys:
  - no-credentials
  - unreadable-key
  - secret-wins
  - default-sign-options
  - default-verify-options
---

# Config

What the config keys do, and what the module refuses at startup.

## Sub-features

- `no-credentials`: with no `secret`, or with a `signKey` and no `verifyKey`, the module fails to construct and `ajs project dev` exits 1 with `Error: Invalid JWT config`.
- `unreadable-key`: key files that do not exist stop the project at startup with the `ENOENT` error naming the file.
- `secret-wins`: with `secret` and key files both set, the secret signs and verifies (HS256) and the key files are never read.
- `default-sign-options`: `signOptions.expiresIn` applies to every token; an `expiresIn` passed to `SignRaw` replaces it.
- `default-verify-options`: `verifyOptions.ignoreExpiration` applies to every validation, including the protected route; an option passed to `ValidateRaw` replaces it.

## How to get to it (user POV)

- `modules["auth-jwt"].config` in `antelope.config.ts`, as in the README's configuration section.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" config
```

## Gotchas

- `ajs project modules add` writes `secret: "your-secret-key"`; the README tells the user to replace it. No journey judges the placeholder.
- The startup refusals run `ajs project dev` to its exit and read the output, since the harness's `dev` waits for a running project.
