<a href="https://github.com/AntelopeJS/antelopejs"><img data-illustration src="./.github/readme/strip.svg" width="100%" alt="PROVIDER · AUTH JWT: part of AntelopeJS, hexagonal architecture beyond your own code. A glowing button reads Star AntelopeJS."></a>

<div align="center">

# `@antelopejs/auth-jwt`

<a href="https://www.npmjs.com/package/@antelopejs/auth-jwt"><img data-illustration alt="npm" src="https://img.shields.io/npm/v/@antelopejs/auth-jwt?style=for-the-badge&labelColor=000000&color=000000"></a> <a href="./LICENSE"><img data-illustration alt="License" src="https://img.shields.io/npm/l/@antelopejs/auth-jwt?style=for-the-badge&labelColor=000000&color=000000"></a> <a href="https://discord.gg/g4pFt6eXqu"><img data-illustration alt="Discord" src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000"></a> <a href="https://interfaces.antelopejs.com/docs/auth/introduction"><img data-illustration alt="Documentation" src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000"></a> <a href="https://github.com/AntelopeJS/antelopejs"><img data-illustration alt="Star AntelopeJS" src="https://img.shields.io/github/stars/AntelopeJS/antelopejs?label=Star%20AntelopeJS&style=for-the-badge&labelColor=000000&color=000000&logo=github"></a>

**The AntelopeJS authentication module. It signs and verifies tokens as JSON Web Tokens.**

[Documentation](https://interfaces.antelopejs.com/docs/auth/introduction) · [Interfaces](#interfaces) · [All interfaces and providers](https://github.com/AntelopeJS/antelopejs#ecosystem)

</div>

The AntelopeJS authentication module. It implements `@antelopejs/interface-auth` and signs and verifies its tokens as JSON Web Tokens with [`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken).

## Interfaces

| Interface                                                                    | Documentation                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`@antelopejs/interface-auth`](https://github.com/AntelopeJS/interface-auth) | [Auth](https://interfaces.antelopejs.com/docs/auth/introduction) |

The interface pages document the `@Authentication` decorator, custom auth decorators, token sources, and cookies. The module also depends on [`@antelopejs/interface-api`](https://interfaces.antelopejs.com/docs/api/introduction), which [`@antelopejs/api`](https://github.com/AntelopeJS/api) implements.

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
        version: "^2.0.0",
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

When the `JWT_SECRET` environment variable is set, `envOverrides` writes its value into `secret`.

To sign with a key pair instead, give the paths of the two key files. The module reads both files when it constructs.

```typescript fragment
config: {
  signKey: "./keys/private.pem",
  verifyKey: "./keys/public.pem",
  signOptions: { algorithm: "RS256", expiresIn: "1h" },
  verifyOptions: { algorithms: ["RS256"] },
},
```

| Key             | Description                                                                                                                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `secret`        | Shared secret that signs and verifies tokens. Takes precedence over `signKey` and `verifyKey`.                                                                                                                                      |
| `signKey`       | Path of the private key file. The module uses it with `verifyKey` when `secret` is empty or not set.                                                                                                                                |
| `verifyKey`     | Path of the public key file.                                                                                                                                                                                                        |
| `signOptions`   | Default [`jsonwebtoken` sign options](https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback). The `expiresIn` and `notBefore` that `SignRaw` or `SignServerResponse` receive override them. |
| `verifyOptions` | Default [`jsonwebtoken` verify options](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback). Options passed to `ValidateRaw` override them.                                               |

The module refuses to start without a non-empty `secret` or both `signKey` and `verifyKey`, and throws `Invalid JWT config`. An empty string counts as not set. `ajs project modules add` writes `secret: "your-secret-key"`. Replace it before you deploy.

## Quick start

In the module that serves the routes, add both interfaces.

```bash
pnpm add @antelopejs/interface-api @antelopejs/interface-auth
```

Issue a token as a cookie, then read it back on a protected route.

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

`GET /session/me` reads the token from the `x-antelopejs-auth` header, or from the `ANTELOPEJS_AUTH` cookie when the header is absent. It answers `401` when the token is missing. It answers `403` when the token is invalid or expired, or when its payload is neither a string nor a JSON object, such as an array or a number.

## Documentation

- [Auth](https://interfaces.antelopejs.com/docs/auth/introduction) documents the `@antelopejs/interface-auth` contract that this module implements.
- [Configuration](https://framework.antelopejs.com/docs/concepts/configuration) documents module sources, `config` blocks, and config variables in `antelope.config.ts`.

## Compatibility

<!-- antelopejs-docs-compat:start -->

| Package                      | Supported        | Tested with |
| ---------------------------- | ---------------- | ----------- |
| `@antelopejs/interface-api`  | `>=0.2.0 <1.0.0` | `0.2.0`     |
| `@antelopejs/interface-auth` | `>=0.2.0 <0.3.0` | `0.2.0`     |
| `@antelopejs/interface-core` | `>=0.4.0 <1.0.0` | `0.4.0`     |

<!-- antelopejs-docs-compat:end -->

The generated table lists the interface packages and ranges this module loads, read from `package.json`.

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

## Part of AntelopeJS

This package belongs to [AntelopeJS](https://github.com/AntelopeJS/antelopejs), the TypeScript framework where modules depend on contracts and the application chooses the provider. The open-source back office [AntelopeJS DMS](https://github.com/AntelopeJS/dms) is built on it.

<!-- antelopejs-framework-modules:start -->

| Area         | Contracts                                                                                                                                                                                                                                                                                                                                                                                                                  | Providers                                                                                                                                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API          | [`interface-api`](https://github.com/AntelopeJS/interface-api) · [`interface-api-util`](https://github.com/AntelopeJS/interface-api-util) · [`interface-data-api`](https://github.com/AntelopeJS/interface-data-api)                                                                                                                                                                                                       | [`api`](https://github.com/AntelopeJS/api)                                                                                                                                                                                                          |
| Auth         | [`interface-auth`](https://github.com/AntelopeJS/interface-auth)                                                                                                                                                                                                                                                                                                                                                           | **`auth-jwt`**                                                                                                                                                                                                                                      |
| Database     | [`interface-database`](https://github.com/AntelopeJS/interface-database) · [`interface-database-decorators`](https://github.com/AntelopeJS/interface-database-decorators) · [`interface-database-catalog`](https://github.com/AntelopeJS/interface-database-catalog) · [`interface-mongodb`](https://github.com/AntelopeJS/interface-mongodb) · [`interface-rethinkdb`](https://github.com/AntelopeJS/interface-rethinkdb) | [`postgres`](https://github.com/AntelopeJS/postgres) · [`mongodb`](https://github.com/AntelopeJS/mongodb) · [`rethinkdb`](https://github.com/AntelopeJS/rethinkdb)                                                                                  |
| Redis        | [`interface-redis`](https://github.com/AntelopeJS/interface-redis) · [`interface-redis-scheduler`](https://github.com/AntelopeJS/interface-redis-scheduler)                                                                                                                                                                                                                                                                | [`redis`](https://github.com/AntelopeJS/redis)                                                                                                                                                                                                      |
| Email        | [`interface-email`](https://github.com/AntelopeJS/interface-email)                                                                                                                                                                                                                                                                                                                                                         | [`nodemailer`](https://github.com/AntelopeJS/nodemailer) · [`brevo`](https://github.com/AntelopeJS/brevo)                                                                                                                                           |
| File storage | [`interface-file-storage`](https://github.com/AntelopeJS/interface-file-storage)                                                                                                                                                                                                                                                                                                                                           | [`file-storage-local`](https://github.com/AntelopeJS/file-storage-local) · [`file-storage-s3`](https://github.com/AntelopeJS/file-storage-s3)                                                                                                       |
| Payments     | [`interface-payment`](https://github.com/AntelopeJS/interface-payment) · [`interface-subscriptions`](https://github.com/AntelopeJS/interface-subscriptions) · [`interface-stripe`](https://github.com/AntelopeJS/interface-stripe)                                                                                                                                                                                         | [`stripe`](https://github.com/AntelopeJS/stripe) · [`mollie`](https://github.com/AntelopeJS/mollie) · [`checkout-com`](https://github.com/AntelopeJS/checkout-com) · [`payment-subscriptions`](https://github.com/AntelopeJS/payment-subscriptions) |

<!-- antelopejs-framework-modules:end -->

## License

[Apache-2.0](LICENSE)
