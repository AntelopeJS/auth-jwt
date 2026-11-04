---
covers:
  - src/implementations/auth/index.ts
  - src/jwt.ts
docs:
  - README.md
journeys:
  - login-then-me
---

# Session

The README's quick start: a login route calls `SignServerResponse` to set the `ANTELOPEJS_AUTH` cookie, and a protected route takes the claims with `@Authentication()`.

## Sub-features

- `login-then-me`: `POST /session/login` answers `{ ok: true }` and sets `ANTELOPEJS_AUTH=<token>; httpOnly; path=/`; the token is signed with the secret and lives the hour the route asked for; `GET /session/me` answers the same claims when the token arrives in the cookie and when it arrives in the `x-antelopejs-auth` header, and answers 401 Unauthorized without one.

## How to get to it (user POV)

- A controller with a route that calls `SignServerResponse(context.rawResponse, claims, { expiresIn }, cookieOptions)` and a route with an `@Authentication()` parameter, next to `@antelopejs/api`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" session
```

## Gotchas

- The two routes are `routes-source.ts`, plain JavaScript that applies the decorators the way TypeScript compiles them. The API module listens on a free loopback port the journey picks.
- Requests go through `curl -i` so the evidence keeps the response headers.
