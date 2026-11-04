---
covers:
  - src/index.ts
  - src/jwt.ts
  - src/implementations/auth/index.ts
docs:
  - README.md
journeys:
  - secret-roundtrip
  - string-payload
---

# Secret

An application module signs data with `SignRaw` and validates it with `ValidateRaw` of the auth interface; the module answers with an HS256 token keyed by the configured `secret`.

## Sub-features

- `secret-roundtrip`: an object becomes a three-part token whose header is `{ alg: "HS256", typ: "JWT" }`, whose payload holds the claims plus `iat`, and whose signature is the HMAC-SHA256 of the secret, recomputed here with `node:crypto`; `ValidateRaw` returns the same claims.
- `string-payload`: a string is carried as the payload text itself and validates back to the same string.

## How to get to it (user POV)

- A module that imports `@antelopejs/interface-auth` and calls `SignRaw(data, options?)` and `ValidateRaw(token, options?)`; the project config holds `secret` for the auth-jwt module.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" secret
```

## Gotchas

- Calls go through the driver module's `/call` route, which cannot carry an `HTTPResult`: a refusal reads as `[object Object]`. Statuses and messages are read over HTTP in [rejection](rejection.md).
