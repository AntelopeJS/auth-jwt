import { SignOptions as JWTSignOptions, VerifyOptions } from 'jsonwebtoken';
import { getJWTHandler } from '../../index';
import { SignOptions } from '@ajs.local/auth/beta';

export namespace internal {
  export const Verify = (data?: string, options?: VerifyOptions) => {
    return getJWTHandler().verify(data, options);
  };

  export const Sign = (data: string | Buffer | object, options?: SignOptions) => {
    return getJWTHandler().sign(data, options as JWTSignOptions);
  };
}
