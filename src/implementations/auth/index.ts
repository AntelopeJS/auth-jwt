import type {
  AuthClaims,
  AuthPayload,
  SignOptions,
} from "@antelopejs/interface-auth";
import type {
  SignOptions as JWTSignOptions,
  VerifyOptions as JWTVerifyOptions,
} from "jsonwebtoken";

import { getJWTHandler } from "../../index";

function createJWTSignOptions(
  options?: SignOptions,
): JWTSignOptions | undefined {
  if (!options) {
    return undefined;
  }

  const jwtSignOptions: JWTSignOptions = {};

  if (options.expiresIn !== undefined) {
    jwtSignOptions.expiresIn = options.expiresIn;
  }

  if (options.notBefore !== undefined) {
    jwtSignOptions.notBefore = options.notBefore;
  }

  return jwtSignOptions;
}

export namespace internal {
  export function Verify(
    data?: string,
    options?: JWTVerifyOptions,
  ): Promise<AuthClaims> {
    return getJWTHandler().verify(data, options);
  }

  export function Sign(
    data: AuthPayload,
    options?: SignOptions,
  ): Promise<string> {
    return getJWTHandler().sign(data, createJWTSignOptions(options));
  }
}
