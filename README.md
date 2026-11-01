# @antelopejs/auth-jwt

<div align="center">
<a href="https://www.npmjs.com/package/@antelopejs/auth-jwt"><img alt="npm" src="https://img.shields.io/npm/v/@antelopejs/auth-jwt?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="./LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@antelopejs/auth-jwt?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="https://discord.gg/g4pFt6eXqu"><img src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000" alt="Discord"></a>
<a href="https://interfaces.antelopejs.com/docs/auth/introduction"><img src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000" alt="Documentation"></a>
</div>

The AntelopeJS authentication module: it signs and verifies the auth interface's tokens as JSON Web Tokens, with [`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken).

## Interfaces

| Interface                                                                    | Documentation                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`@antelopejs/interface-auth`](https://github.com/AntelopeJS/interface-auth) | [Auth](https://interfaces.antelopejs.com/docs/auth/introduction) |

The `@Authentication` decorator, custom auth decorators, token sources and cookies are documented on the interface pages. The module also depends on [`@antelopejs/interface-api`](https://interfaces.antelopejs.com/docs/api/introduction), implemented by [`@antelopejs/api`](https://github.com/AntelopeJS/api).

## Install

```bash
ajs project modules add @antelopejs/auth-jwt
ajs project modules install
```

`ajs project modules install` adds `@antelopejs/api` when no module of the project implements the API interface yet.

## Configuration

Sign with a shared secret:

```typescript [antelope.config.ts]
import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "my-project",
  modules: {
    "auth-jwt": {
      source: {
        type: "package",
        package: "@antelopejs/auth-jwt",
        version: "^1.0.3",
      },
      config: {
        secret: "change-me",
        signOptions: { expiresIn: "1h" },
        verifyOptions: { ignoreExpiration: false },
      },
    },
  },
  envOverrides: {
    JWT_SECRET: "modules.auth-jwt.config.secret",
  },
});
```

Or with a key pair read from disk at startup:

```typescript
config: {
  signKey: "./keys/private.pem",
  verifyKey: "./keys/public.pem",
  signOptions: { algorithm: "RS256", expiresIn: "1h" },
  verifyOptions: { algorithms: ["RS256"] },
},
```

| Key             | Description                                                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `secret`        | Shared secret that signs and verifies tokens. Takes precedence over `signKey` and `verifyKey`.                                                                                                |
| `signKey`       | Path of the private key file. Used with `verifyKey` when `secret` is not set.                                                                                                                 |
| `verifyKey`     | Path of the public key file.                                                                                                                                                                  |
| `signOptions`   | Default [`jsonwebtoken` sign options](https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback). `SignRaw` options override `expiresIn` and `notBefore`. |
| `verifyOptions` | Default [`jsonwebtoken` verify options](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback).                                                        |

The module refuses to start without `secret` or both `signKey` and `verifyKey`. `ajs project modules add` writes `secret: "your-secret-key"`: replace it before deploying.

## Quick start

In the module that serves the routes, add both interfaces:

```bash
pnpm add @antelopejs/interface-api @antelopejs/interface-auth
```

Issue a token as a cookie, then read it back on a protected route:

```typescript [src/index.ts]
import {
  Context,
  Controller,
  Get,
  Post,
  type RequestContext,
} from "@antelopejs/interface-api";
import { Authentication, SignServerResponse } from "@antelopejs/interface-auth";

interface Session {
  userId: string;
}

export class SessionController extends Controller("/session") {
  @Post("/login")
  async login(@Context() context: RequestContext) {
    await SignServerResponse(
      context.rawResponse,
      { userId: "42" },
      { expiresIn: "1h" },
      { httpOnly: true, path: "/" },
    );
    return { ok: true };
  }

  @Get("/me")
  me(@Authentication() session: Session) {
    return session;
  }
}
```

`GET /session/me` reads the token from the `x-antelopejs-auth` header or the `ANTELOPEJS_AUTH` cookie. It answers `401` when the token is missing and `403` when it is invalid or expired.

## Documentation

- [Auth](https://interfaces.antelopejs.com/docs/auth/introduction): the `@antelopejs/interface-auth` contract this module implements
- [Configuration](https://framework.antelopejs.com/docs/concepts/configuration): module sources, `config` blocks and config variables in `antelope.config.ts`

## Compatibility

<!-- antelopejs-docs-compat:start -->

| Package                      | Supported         | Tested with |
| ---------------------------- | ----------------- | ----------- |
| `@antelopejs/interface-api`  | `>=0.0.15 <1.0.0` | `0.0.15`    |
| `@antelopejs/interface-auth` | `>=0.1.0 <0.2.0`  | `0.1.0`     |
| `@antelopejs/interface-core` | `>=0.2.4 <1.0.0`  | `0.2.4`     |

<!-- antelopejs-docs-compat:end -->

| Package                      | Supported range   |
| ---------------------------- | ----------------- |
| `@antelopejs/interface-auth` | `>=0.1.0 <0.2.0`  |
| `@antelopejs/interface-api`  | `>=0.0.15 <1.0.0` |
| `@antelopejs/interface-core` | `>=0.2.4 <1.0.0`  |

The module is developed and tested against `@antelopejs/core` `^1.13.4` on Node.js 24.

## Contributing

```bash
pnpm install
pnpm dev            # run the playground/ project in watch mode
pnpm lint
pnpm format:check
pnpm knip
pnpm test           # build, then ajs module test
```

Read the [contribution guidelines](CONTRIBUTING.md) before opening a pull request.

## License

[Apache-2.0](LICENSE)
