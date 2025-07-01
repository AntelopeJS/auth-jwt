![Auth JWT](.github/social-card.png)

# @antelopejs/auth-jwt

<div align="center">
<a href="https://www.npmjs.com/package/@antelopejs/core"><img alt="NPM version" src="https://img.shields.io/npm/v/@antelopejs/core.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/AntelopeJS/antelopejs/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@antelopejs/core.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://discord.gg/C2G8QW63"><img src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000" alt="Discord"></a>
<a href="https://discord.gg/C2G8QW63"><img src="https://img.shields.io/badge/Docs-18181B?logo=Antelope.JS&style=for-the-badge&color=000000" alt="Documentation"></a>
</div>

A flexible authentication and authorization module that implements the Auth interface of antelopejs with JWT.

## Installation

```bash
ajs project modules add @antelopejs/auth-jwt
```

## Interfaces

This module implements the Auth interface it can be integrated with your application to handle user authentication, token generation, verification, and access control. The interface is installed separately to maintain modularity and minimize dependencies.

| Name          | Install command                         |                                                               |
| ------------- | --------------------------------------- | ------------------------------------------------------------- |
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
