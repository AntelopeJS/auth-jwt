# auth-jwt

The AntelopeJS module that implements `@antelopejs/interface-auth` with `jsonwebtoken`, published as `@antelopejs/auth-jwt`.

## Layout

- `src/index.ts` holds the module lifecycle (`construct`, `destroy`, `start`, `stop`) and registers the implementation.
- `src/jwt.ts` holds `JWTHandler`: key loading, signing, verification, and the cookie header.
- `src/implementations/auth/index.ts` implements the interface-auth contract on top of `JWTHandler`.
- `playground/` is a separate workspace package for manual runs with `pnpm dev`.

## Versioning

- Every `@antelopejs/*` range sits on the newest published minor and stops below the next one: `>=0.5.1 <0.6.0` on a 0.x package, `~1.23.0` on a 1.x one. A 0.x minor can break the contract, so moving to one means updating the code and raising both bounds together. The `dependency:ranges` step of `pnpm run checks` checks every range in the repository.
- When you raise a minimum, update the Compatibility table in `README.md` too.

## Tests

- `pnpm test` builds `dist`, then runs `ajs module test`. `src/test/antelope.test.ts` (`antelopeJs.test` in `package.json`) describes the test project: this module with a test secret, plus `@antelopejs/api` from npm at a pinned version on `127.0.0.1:5010`, so that port must be free.
- `antelope-lock/` records the lockfile `@antelopejs/api` installed with, and `ajs module test` installs from it, so every run tests the same dependencies. Commit what `pnpm test` records there. When you change the pinned version, refresh it with `rm -rf antelope-lock && pnpm run test`.
- The test suites are not in this repository. They ship compiled in `@antelopejs/interface-auth` (`dist/tests`) and `require("chai")` from this module's `node_modules`, so `chai` stays in `package.json` although no source file imports it.
- `pnpm run checks` does not build or run the playground. Run it with `pnpm dev`.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

CI runs `pnpm run checks` in full on every pull request and reports what failed. The commit hook formats and lints the staged files. Locally, run only the fast check for what you touched:

- `pnpm run typecheck` after you change types or signatures.
- `pnpm exec oxlint <files>` and `pnpm exec oxfmt <files>` on the files you changed.
- One test file, not the suite. In a module that tests with `ajs module test`: `pnpm run build`, then `pnpm exec ajs module test . -f dist/<path>.test.js`.

### Comments

Say it in code: a constraint in a type, a lint rule or a test, a public item's contract in TSDoc. Other comments are lint directives naming their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, and license or tool directives. A reason states what the code does now.

### Tests

Each test names the wrong implementation it fails on, or is deleted. Drive behaviour through the public interface. An invariant over many files is a lint rule.

### Review

No tool checks these:

- A type guard checks the nested elements and values it claims.
- A no-upward import rule rejects same-tier peers; probe it with an import.
- A finding only an evasion or a patched internal can trigger goes under Attention and never blocks.

### Suppressions

`guardrails.suppressions.json` caps lint directives, `@ts-expect-error`, `SAFETY:` comments and rules a lint config turns off. Over a cap, fix the code or remove another suppression of that kind; only the operator raises a number. After removing suppressions, run `pnpm run suppressions:update` and commit the file.

<!-- antelopejs-guardrails:end -->
