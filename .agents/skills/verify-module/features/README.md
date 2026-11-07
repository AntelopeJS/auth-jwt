# Feature map

One file per feature. `covers:` lists the source globs it owns, `docs:` the pages a verdict judges, and `journeys:` the journeys it runs. `pnpm exec antelopejs-verify map` checks that every user-facing file is covered.

The module keeps no state and calls no service, so no journey needs a container. Every journey runs the module in `ajs project dev` next to the API module from the registry (`@antelopejs/api` 2.0.0, which implements the `@antelopejs/interface-api` the consumer loads from this repository; 1.2.4 now resolves interface-api 0.3.0, so the consumer's routes answer 404) and a small consumer that holds the README's two routes. The first run needs network access to fetch the API module. Tokens are taken apart and recomputed with `node:crypto` in `tokens.ts`, so the module never vouches for its own output.

| Feature | What the user does | Journeys |
|---|---|---|
| [secret](secret.md) | Signs objects and strings with a shared secret and validates them back. | secret-roundtrip, string-payload |
| [session](session.md) | Logs in through a route that sets the cookie and reads it on a protected route. | login-then-me |
| [rejection](rejection.md) | Sends no token, forged, malformed or non-object tokens and is refused. | missing-token, bad-signature, malformed-token, non-object-payload |
| [lifetime](lifetime.md) | Sets how long tokens live, when they start and how old they may be. | expires-in, not-before, expired-token, max-age |
| [keypair](keypair.md) | Signs and verifies with key files and RS256. | rs256-roundtrip, foreign-key, algorithm-confusion |
| [config](config.md) | Configures credentials and default options, or gets a refusal at startup. | no-credentials, unreadable-key, secret-wins, default-sign-options, default-verify-options |
| [smoke](smoke.md) | The fixed journey every verdict runs. | module-dev, secret-roundtrip |
