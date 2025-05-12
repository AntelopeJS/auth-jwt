![Auth JWT](.github/social-card.png)

# @antelopejs/auth-jwt

[![npm version](https://img.shields.io/npm/v/@antelopejs/auth-jwt.svg)](https://www.npmjs.com/package/@antelopejs/auth-jwt)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

A flexible authentication and authorization module that implements the Auth interface of antelopejs with JWT.

## Installation

```bash
ajs project modules add @antelopejs/auth-jwt
```

## Interfaces

This module implements the Auth interface it can be integrated with your application to handle user authentication, token generation, verification, and access control. The interface is installed separately to maintain modularity and minimize dependencies.

| Name          | Install command                         |            |
| ------------- | --------------------------------------- | ---------- |
| Auth          | `ajs module imports add auth`           | [Documentation](https://github.com/AntelopeJS/interface-auth) |

## Configuration

The Auth module can be configured with the following options:

```json
{
  "secret": "your-secret-key",
  "signKey": "path-to-private-key-file",
  "verifyKey": "path-to-public-key-file",
  "signOptions": {
    "expiresIn": "1h",
    "algorithm": "RS256"
  },
  "verifyOptions": {
    "ignoreExpiration": false,
    "algorithms": ["RS256"]
  }
}
```

The configuration options include:

- `secret`: A shared secret key used for both signing and verification (symmetric)
- `signKey`: Path to a private key file (for asymmetric signing)
- `verifyKey`: Path to a public key file (for asymmetric verification)
- `signOptions`: Options for token signing (follows jsonwebtoken's SignOptions)
- `verifyOptions`: Options for token verification (follows jsonwebtoken's VerifyOptions)

Note: Either `secret` or both `signKey` and `verifyKey` must be provided.

## Usage with API Controllers

As this module interfaces auth decorator with the interface API provider system, it can be used with API controllers.

Authentication decorators can be used with any parameter in API controller methods. They can be combined with other parameters and decorators:

```typescript
import { Controller, Get } from '@ajs/api/beta';
import { Authentication, AdminAuth } from '@ajs/auth/beta';

class UsersController extends Controller('/users') {
  // Accessible to all authenticated users
  @Get()
  async listUsers(@Authentication() user: any) {
    // List users
    return { users: [] };
  }
}
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
