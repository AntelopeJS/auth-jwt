---
covers:
  - src/implementations/auth/index.ts
  - src/jwt.ts
docs:
  - README.md
journeys:
  - expires-in
  - not-before
  - expired-token
  - max-age
---

# Lifetime

How long a token lives, when it starts to count and how old it may be.

## Sub-features

- `expires-in`: `expiresIn` as a timespan (`"1h"`, `"2d"`) or as seconds (`90`) sets `exp` that many seconds after `iat`, and the token validates.
- `not-before`: `notBefore: "1h"` sets `nbf` an hour after `iat`; the protected route answers 403 `Forbidden (jwt not active)`; `ValidateRaw` refuses it and `ignoreNotBefore` lets it through.
- `expired-token`: a token past its `exp` is answered 403 `Forbidden (jwt expired)`; `ValidateRaw` refuses it and `ignoreExpiration` lets it through.
- `max-age`: a token issued two hours ago with no `exp` validates with no limit, is refused under `maxAge: "1h"` and accepted under `maxAge: "3h"`.

## How to get to it (user POV)

- `SignRaw(data, { expiresIn, notBefore })` and `ValidateRaw(token, { ignoreExpiration, ignoreNotBefore, maxAge })` of the auth interface.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" lifetime
```

## Gotchas

- Expired and old tokens are written by `tokens.ts` with a past `iat`; no journey sleeps.
- `ValidateRaw` through the driver reports a refusal only as `ok: false`, so the status and message of a refusal are read over HTTP.
