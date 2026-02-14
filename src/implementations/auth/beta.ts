import { type SignOptions as JWTSignOptions, type VerifyOptions as JWTVerifyOptions } from 'jsonwebtoken';
import { getJWTHandler } from '../../index';
import { type SignOptions } from '@ajs.local/auth/beta';
import { type JWTSignPayload } from '../../jwt';

type AuthPayload = unknown;

function createJWTSignOptions(options?: SignOptions): JWTSignOptions | undefined {
  if (!options) {
    return undefined;
  }

  return {
    expiresIn: options.expiresIn as JWTSignOptions['expiresIn'],
    notBefore: options.notBefore as JWTSignOptions['notBefore'],
  };
}

export namespace internal {
  export function Verify<T = AuthPayload>(data?: string, options?: JWTVerifyOptions): Promise<T> {
    return getJWTHandler().verify<T>(data, options);
  }

  export function Sign(data: JWTSignPayload, options?: SignOptions): Promise<string> {
    return getJWTHandler().sign(data, createJWTSignOptions(options));
  }
}
