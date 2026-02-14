import { type SignOptions as JWTSignOptions, type VerifyOptions as JWTVerifyOptions } from 'jsonwebtoken';
import { getJWTHandler } from '../../index';
import { type SignOptions } from '@ajs.local/auth/beta';
import { type JWTSignPayload } from '../../jwt';

type AuthPayload = unknown;

function createJWTSignOptions(options?: SignOptions): JWTSignOptions | undefined {
  if (!options) {
    return undefined;
  }

  const jwtSignOptions: JWTSignOptions = {};

  if (options.expiresIn !== undefined) {
    jwtSignOptions.expiresIn = options.expiresIn as NonNullable<JWTSignOptions['expiresIn']>;
  }

  if (options.notBefore !== undefined) {
    jwtSignOptions.notBefore = options.notBefore as NonNullable<JWTSignOptions['notBefore']>;
  }

  return jwtSignOptions;
}

export namespace internal {
  export function Verify<T = AuthPayload>(data?: string, options?: JWTVerifyOptions): Promise<T> {
    return getJWTHandler().verify<T>(data, options);
  }

  export function Sign(data: JWTSignPayload, options?: SignOptions): Promise<string> {
    return getJWTHandler().sign(data, createJWTSignOptions(options));
  }
}
