---
covers:
  - src/jwt.ts
docs:
  - README.md
journeys:
  - missing-token
  - bad-signature
  - malformed-token
  - non-object-payload
---

# Rejection

A protected route refuses what it should not trust: 401 when no token arrives, 403 with the reason when the token is invalid.

## Sub-features

- `missing-token`: a request with no header and no cookie is answered 401 `Unauthorized`.
- `bad-signature`: a token of another secret, a token whose claims were edited after signing, an unsigned token (`alg: none`) and a token of another HMAC algorithm are all answered 403 `Forbidden (<reason>)`.
- `malformed-token`: text that is not a compact token and a token missing its signature segment are answered 403 `Forbidden (jwt malformed)`.
- `non-object-payload`: a correctly signed token whose payload is a JSON array is answered 403 `Forbidden (the payload is not a JSON object)`, while a plain string the module signed is accepted.

## How to get to it (user POV)

- Any route with an `@Authentication()` parameter, called by a client with a bad or missing token.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" rejection
```

## Gotchas

- Forged tokens are written by `tokens.ts` with `node:crypto`, not by the module under test.
- The reason inside the parentheses is jsonwebtoken's own message; a library upgrade that rewords one fails the journey on purpose, because clients read that body.
