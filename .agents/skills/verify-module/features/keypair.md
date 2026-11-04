---
covers:
  - src/jwt.ts
docs:
  - README.md
journeys:
  - rs256-roundtrip
  - foreign-key
  - algorithm-confusion
---

# Keypair

The key-pair setup of the README: `signKey` and `verifyKey` name PEM files read at startup, with `signOptions.algorithm` set to `RS256`.

## Sub-features

- `rs256-roundtrip`: the token's header names RS256, the public key file verifies its signature (checked here with `node:crypto`), `ValidateRaw` returns the claims and the protected route accepts the token.
- `foreign-key`: an RS256 token signed with another private key is answered 403 `Forbidden (invalid signature)`, while one signed with the module's own private key is accepted.
- `algorithm-confusion`: an HS256 token keyed with the public key file's text is answered 403 `Forbidden (invalid algorithm)`.

## How to get to it (user POV)

- Module config with `signKey`, `verifyKey`, `signOptions: { algorithm: "RS256" }` and `verifyOptions: { algorithms: ["RS256"] }`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" keypair
```

## Gotchas

- Each journey generates its own 2048-bit RSA pair with `node:crypto` and writes it under the journey's scratch folder.
