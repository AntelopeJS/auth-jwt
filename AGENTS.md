# auth-jwt

The AntelopeJS module that implements `@antelopejs/interface-auth` with `jsonwebtoken`, published as `@antelopejs/auth-jwt`.

## Layout

- `src/index.ts` holds the module lifecycle (`construct`, `destroy`, `start`, `stop`) and registers the implementation.
- `src/jwt.ts` holds `JWTHandler`: key loading, signing, verification, and the cookie header.
- `src/implementations/auth/index.ts` implements the interface-auth contract on top of `JWTHandler`.
- `playground/` is a separate workspace package for manual runs with `pnpm dev`.

## Versioning

- `@antelopejs/interface-api` and `@antelopejs/interface-core` are consumed interfaces with a `>=minimum <1.0.0` range.
- `@antelopejs/interface-auth` is the implemented interface (`antelopeJs.implements`), so its range stops below the next minor (`>=0.1.0 <0.2.0`). A 0.x minor can break the contract this module implements, so moving to one means updating the implementation and raising both bounds together. `pnpm lint` runs `antelopejs-check-interface-ranges`, which checks every interface range in the repository.
- When you raise a minimum, update the Compatibility table in `README.md` too.

## Tests

- `pnpm test` builds `dist`, then runs `ajs module test`. `src/test/antelope.test.ts` (`antelopeJs.test` in `package.json`) describes the test project: this module with a test secret, plus `@antelopejs/api` from npm at a pinned version on `127.0.0.1:5010`, so that port must be free.
- The test suites are not in this repository. They ship compiled in `@antelopejs/interface-auth` (`dist/tests`) and `require("chai")` from this module's `node_modules`, so `chai` stays in `package.json` although no source file imports it.
- `pnpm run checks` does not build or run the playground. Run it with `pnpm dev`.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

Finish every change with `pnpm run checks`. It runs typecheck, lint, format, knip, tests, size, ratchet, and sync, and prints only what failed. The change is done when it prints no failure.

The tools enforce most rules, listed in the table at the end. The sections below hold the rules no tool checks.

### Comments

Say it in code. A constraint belongs in a type, a lint rule, or a test. A public item's contract belongs in TSDoc (`/** */`) on that item. The only other comments are lint directives that name their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, `/*!` license headers, and bundler or formatter directives.

### Tests

Hold every test you write or keep to this checklist:

- Name the wrong implementation this test fails on. A test with no answer is deleted, not kept.
- No test reads the file it tests. Drive the behaviour through the public interface.
- An invariant over many files is a lint rule, not a test.

### Debt

`guardrails.ratchet.json` records the lint findings and oversize files this repository already had. Its numbers only go down. After you remove debt, run `pnpm run ratchet:update` and commit the lowered file. A rule listed there is off for `oxlint`. The ratchet counts it instead, and the pre-commit hook rejects it on every line you add.

### What enforces what

| Rule                                                                           | Enforced by                               |
| ------------------------------------------------------------------------------ | ----------------------------------------- |
| Formatting                                                                     | oxfmt                                     |
| Lint findings are errors; no rule warns                                        | oxlint preset                             |
| Comments are TSDoc, directives, or `SAFETY:` only                              | `antelopejs/no-comments`                  |
| Every test asserts                                                             | `antelopejs/require-assertion`            |
| Tests read no files outside fixtures, helpers, locales                         | `antelopejs/no-fs-read-in-tests`          |
| No assertion that restates a constant                                          | `antelopejs/no-constant-value-assertion`  |
| No test whose only check is "is a function"                                    | `antelopejs/no-typeof-function-only-test` |
| Params ≤ 5, function ≤ 120 lines, file ≤ 500 lines, depth ≤ 4, complexity ≤ 20 | `eslint/max-*`, `eslint/complexity`       |
| Files ≤ 20,000 bytes, tests included                                           | `antelopejs-check-size` (pre-commit)      |
| Existing debt only shrinks                                                     | `antelopejs-ratchet`                      |
| Types check                                                                    | `tsc` (pre-push)                          |
| No dead files, exports, or dependencies                                        | knip                                      |
| Managed files match the pack                                                   | `antelopejs-sync --check`                 |
| A test names the wrong implementation it catches                               | review; no tool                           |

<!-- antelopejs-guardrails:end -->
