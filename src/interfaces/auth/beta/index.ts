import { InterfaceFunction } from '@ajs/core/beta';
import { MakeParameterAndMethodAndPropertyAndClassDecorator } from '@ajs/core/beta/decorators';
import { IncomingMessage, ServerResponse } from 'http';
import { SetParameterProvider } from '@ajs/api/beta';

/**
 * @internal
 */
export namespace internal {
  export const Verify = InterfaceFunction<(data?: string, options?: VerifyOptions) => any>();
  export const Sign = InterfaceFunction<(data: string | Buffer | object, options?: SignOptions) => string>();

  export function defaultSource(req: IncomingMessage): string | undefined {
    if (req.headers['x-antelopejs-auth']) {
      return req.headers['x-antelopejs-auth'] as string;
    }
    if (req.headers['cookie']) {
      const match = (' ' + req.headers['cookie']).match(/ ANTELOPEJS_AUTH=([^;]*)/);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }

  export const defaultAuthenticator = ValidateRaw as AuthVerifier<any>;

  /**
   * Verifies the signature of signed data attached to the HTTP request and returns the data contained therein.
   *
   * @template T - The type of data after verification
   * @template R - The type of data after validation
   * @param req - HTTP Request
   * @param res - HTTP Response
   * @param source - Callback to retrieve the signed data from the request
   * @param authenticator - Callback to verify the signature
   * @param authenticatorOptions - Verifier options
   * @param validator - Custom validator callback
   * @returns The authenticated and validated data
   */
  export async function CheckAuthentication<T = unknown, R = unknown>(
    req: IncomingMessage,
    res: ServerResponse,
    source: AuthSource | undefined = undefined,
    authenticator: AuthVerifier<T> | undefined = undefined,
    authenticatorOptions: VerifyOptions | undefined = undefined,
    validator: AuthValidator<T, R> | undefined = undefined,
  ) {
    const data = await (authenticator || defaultAuthenticator)(
      (source || defaultSource)(req, res),
      authenticatorOptions,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return validator ? await validator(data as T) : data;
  }
}

/**
 * Function type that extracts authentication data from HTTP request.
 *
 * @param req - The incoming HTTP request
 * @param res - The server response object
 * @returns The authentication token string or undefined if not found
 *
 * @example
 * ```typescript
 * const headerSource: AuthSource = (req) => req.headers['authorization']?.replace('Bearer ', '');
 * ```
 */
export type AuthSource = (req: IncomingMessage, res: ServerResponse) => string | undefined;

/**
 * Function type that verifies authentication data and returns parsed content.
 *
 * @template T - The type of the verified data
 * @param data - The authentication data to verify
 * @param options - Optional verification parameters
 * @returns The verified data or a Promise resolving to the verified data
 *
 * @example
 * ```typescript
 * const jwtVerifier: AuthVerifier<UserProfile> = (token) =>
 *   jwt.verify(token, SECRET_KEY) as UserProfile;
 * ```
 */
export type AuthVerifier<T = unknown> = (data?: string, options?: VerifyOptions) => Promise<T> | T;

/**
 * Function type that performs additional validation on verified authentication data.
 *
 * @template T - The type of input data to validate
 * @template R - The type of the validation result
 * @param data - The verified data to validate
 * @returns The validation result or a Promise resolving to the validation result
 *
 * @example
 * ```typescript
 * const roleValidator: AuthValidator<UserProfile, boolean> = (profile) =>
 *   profile.roles.includes('admin');
 * ```
 */
export type AuthValidator<T = unknown, R = unknown> = (data: T) => Promise<R> | R;

/**
 * HTTP Cookie options for controlling how authentication cookies are set.
 *
 * @property maxAge - Number of milliseconds until the cookie expires
 * @property signed - Whether the cookie should be signed
 * @property expires - Specific date when the cookie expires
 * @property httpOnly - Whether the cookie is only accessible via HTTP(S) and not client JavaScript
 * @property path - URL path for which the cookie is valid
 * @property domain - Domain for which the cookie is valid
 * @property secure - Whether the cookie should only be sent over HTTPS
 *
 * @example
 * ```typescript
 * const secureOptions: CookieOptions = {
 *   httpOnly: true,
 *   secure: true,
 *   maxAge: 3600000, // 1 hour
 *   path: '/'
 * };
 * ```
 */
export interface CookieOptions {
  maxAge?: number;
  signed?: boolean;
  expires?: Date;
  httpOnly?: boolean;
  path?: string;
  domain?: string;
  secure?: boolean;
}

/**
 * Options for signing authentication tokens.
 *
 * @property expiresIn - Duration until the token expires, as seconds or timespan string (e.g. '1h', '2d')
 * @property notBefore - Duration before which the token is not valid, as seconds or timespan string
 *
 * @example
 * ```typescript
 * const tokenOptions: SignOptions = {
 *   expiresIn: '2h', // Token valid for 2 hours
 *   notBefore: '5s'  // Token not valid until 5 seconds after issuance
 * };
 * ```
 */
export interface SignOptions {
  /**
   * Expiration as a number of seconds or a timespan string.
   */
  expiresIn?: string | number;

  /**
   * Not-before field as a number of seconds or a timespan string.
   */
  notBefore?: string | number;
}

/**
 * Options for verifying authentication tokens.
 *
 * @property ignoreExpiration - If true, expired tokens will still be considered valid
 * @property ignoreNotBefore - If true, tokens that are not yet valid will still be considered valid
 * @property maxAge - Maximum age of the token, as seconds or timespan string
 *
 * @example
 * ```typescript
 * const verifyOptions: VerifyOptions = {
 *   ignoreExpiration: false,
 *   maxAge: '30m'  // Reject tokens older than 30 minutes
 * };
 * ```
 */
export interface VerifyOptions {
  /**
   * Ignore signature expiration.
   */
  ignoreExpiration?: boolean;

  /**
   * Ignore signature not-before field.
   */
  ignoreNotBefore?: boolean;

  /**
   * Maximum signature age as a number of seconds or a timespan string.
   */
  maxAge?: string | number;
}

/**
 * Verifies the signature of some signed data and returns the data contained therein.
 *
 * @template T - The type of data expected after verification
 * @param token - The signed data token to verify
 * @param options - Options for verification
 * @returns A promise resolving to the verified data
 *
 * @example
 * ```typescript
 * const userData = await ValidateRaw<UserProfile>(authToken, { maxAge: '1h' });
 * console.log(userData.name);
 * ```
 */
export function ValidateRaw<T = any>(token: string, options?: VerifyOptions): Promise<T> {
  return internal.Verify(token, options);
}

/**
 * Signs some data to create an authentication token.
 *
 * @param data - The data to sign
 * @param options - Options for signing
 * @returns The signed data token
 *
 * @example
 * ```typescript
 * const token = SignRaw({ userId: 123, role: 'admin' }, { expiresIn: '24h' });
 * ```
 */
export function SignRaw(data: string | Buffer | object, options?: SignOptions) {
  return internal.Sign(data, options);
}

/**
 * Signs some data and attaches it to an HTTP Response object as a cookie.
 *
 * @param res - HTTP Response object to set the cookie on
 * @param data - Data to sign and attach
 * @param signOptions - Options for signing the data
 * @param cookieOptions - Options for the cookie
 * @returns A promise that resolves when the cookie has been set
 *
 * @example
 * ```typescript
 * await SignServerResponse(
 *   res,
 *   { userId: 123, permissions: ['read', 'write'] },
 *   { expiresIn: '8h' },
 *   { httpOnly: true, secure: true }
 * );
 * ```
 */
export function SignServerResponse(
  res: ServerResponse,
  data: string | Buffer | object,
  signOptions?: SignOptions,
  cookieOptions?: CookieOptions,
) {
  const opts = cookieOptions
    ? Object.keys(cookieOptions)
        .map((key) => `${key}=${cookieOptions[key as keyof typeof cookieOptions]}`)
        .join('; ')
    : '';

  return SignRaw(data, signOptions).then((data: string) =>
    res.setHeader('Set-Cookie', `ANTELOPEJS_AUTH=${data}; ${opts}`),
  );
}

/**
 * Creates a Parameter Provider using the specified source and signature verification callbacks.
 *
 * The callbacks are processed in the following order:
 * `source(req, res)` => `authenticator(prev, authenticatorOptions)` => `validator(prev)` => Parameter
 *
 * @template R - The type of the final validator result
 * @template T - The type of the authenticated data before validation
 * @param callbacks - Configuration object containing callback functions
 * @param callbacks.source - Extracts the signed data from the request
 * @param callbacks.authenticator - Verifies the signature
 * @param callbacks.authenticatorOptions - Options for verification
 * @param callbacks.validator - Custom validation step (overrideable with decorator call)
 * @returns A decorator for parameters, methods, properties, and classes
 *
 * @example
 * ```typescript
 * // Create a custom auth decorator
 * const RequireAdmin = CreateAuthDecorator({
 *   validator: (user: any) => {
 *     if (!user || user.role !== 'admin') {
 *       throw new Error('Admin access required');
 *     }
 *     return user;
 *   }
 * });
 *
 * // Use the decorator
 * class AdminController {
 *   @Route('/admin/settings')
 *   getSettings(@RequireAdmin() user: UserProfile) {
 *     // Only admin users can access this
 *     return { settings: this.adminSettings };
 *   }
 * }
 * ```
 */
export function CreateAuthDecorator<R = unknown, T = unknown>(callbacks: {
  source?: AuthSource;
  authenticator?: AuthVerifier<T>;
  authenticatorOptions?: VerifyOptions;
  validator?: AuthValidator<T, R>;
}) {
  const source = callbacks.source || <AuthSource>internal.defaultSource;
  const authenticator = callbacks.authenticator || <AuthVerifier<T>>internal.defaultAuthenticator;
  const authenticatorOptions = callbacks.authenticatorOptions || {};
  const defaultValidator = callbacks.validator;

  return MakeParameterAndMethodAndPropertyAndClassDecorator((target, key, index, validator?: AuthValidator<T, R>) => {
    if (typeof index === 'object' || key === undefined) {
      SetParameterProvider(target, Symbol(''), undefined, (context) =>
        internal.CheckAuthentication(
          context.rawRequest,
          context.rawResponse,
          source,
          authenticator,
          authenticatorOptions,
          validator || defaultValidator,
        ),
      );
    } else {
      SetParameterProvider(target, key, index, (context) =>
        internal.CheckAuthentication(
          context.rawRequest,
          context.rawResponse,
          source,
          authenticator,
          authenticatorOptions,
          validator || defaultValidator,
        ),
      );
    }
  });
}

/**
 * Parameter Provider using the default source and signature verification callbacks.
 * This decorator can be applied to parameters, methods, properties, or classes to
 * require authentication.
 *
 * @param validator - Optional custom validation callback
 * @returns The authenticated user data
 *
 * @example
 * ```typescript
 * class UserController {
 *   @Route('/profile')
 *   getProfile(@Authentication user: UserProfile) {
 *     // 'user' contains the authenticated user data
 *     return { name: user.name, email: user.email };
 *   }
 *
 *   @Route('/admin')
 *   adminPage(@Authentication((user) => {
 *     if (user.role !== 'admin') throw new Error('Admin only');
 *     return user;
 *   }) user: UserProfile) {
 *     // Only admins will reach this code
 *     return { adminData: this.sensitiveData };
 *   }
 * }
 * ```
 *
 * @see {@link CreateAuthDecorator}
 */
export const Authentication = CreateAuthDecorator({});
