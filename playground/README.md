# Playground

A local AntelopeJS project for trying `@antelopejs/auth-jwt` while you change it. `antelope.config.ts` loads three modules: `auth-jwt` from the parent folder with the secret `dev`, `@antelopejs/api` from npm with one HTTP server on port `5010`, and `playground` from this folder.

## Run it

From the repository root, run the project in watch mode:

```bash
pnpm dev
```

`pnpm dev` runs `ajs project dev -w -p playground`. Set `JWT_SECRET` to replace the `dev` secret.

## What it checks

When it starts, the `playground` module in `src/index.ts` signs a payload with `SignRaw`, validates the token with `ValidateRaw`, and compares the claims with the payload. It then changes the token and checks that `ValidateRaw` refuses it. It logs each result at debug level.

## Compatibility

<!-- antelopejs-docs-compat:start -->

| Package                      | Supported                                                     | Tested with                                                |
| ---------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| `@antelopejs/interface-api`  | `file:../.campaign/tgz/antelopejs-interface-api-f2a99b5.tgz`  | `file:.campaign/tgz/antelopejs-interface-api-f2a99b5.tgz`  |
| `@antelopejs/interface-auth` | `file:../.campaign/tgz/antelopejs-interface-auth-1dc3d6a.tgz` | `file:.campaign/tgz/antelopejs-interface-auth-1dc3d6a.tgz` |
| `@antelopejs/interface-core` | `file:../.campaign/tgz/antelopejs-interface-core-f7df541.tgz` | `file:.campaign/tgz/antelopejs-interface-core-f7df541.tgz` |

<!-- antelopejs-docs-compat:end -->
