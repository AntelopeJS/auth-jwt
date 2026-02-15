import { IncomingMessage, ServerResponse } from 'http';
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
type AuthPayload = string | Buffer | object;
interface AuthDecoratorCallbacks<T, R> {
    source?: AuthSource;
    authenticator?: AuthVerifier<T>;
    authenticatorOptions?: VerifyOptions;
    validator?: AuthValidator<T, R>;
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
export declare function ValidateRaw<T = unknown>(token?: string, options?: VerifyOptions): Promise<T>;
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
export declare function SignRaw(data: AuthPayload, options?: SignOptions): Promise<string>;
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
export declare function SignServerResponse(res: ServerResponse, data: AuthPayload, signOptions?: SignOptions, cookieOptions?: CookieOptions): Promise<ServerResponse>;
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
export declare function CreateAuthDecorator<R = unknown, T = unknown>(callbacks: AuthDecoratorCallbacks<T, R>): (validator?: AuthValidator<T, R> | undefined) => import("@ajs/core/beta/decorators").ClassDecorator<import("@ajs/core/beta/decorators").Class<any, any[]>> & import("@ajs/core/beta/decorators").PropertyDecorator & import("@ajs/core/beta/decorators").ParameterDecorator;
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
export declare const Authentication: (validator?: AuthValidator<unknown, unknown> | undefined) => import("@ajs/core/beta/decorators").ClassDecorator<import("@ajs/core/beta/decorators").Class<any, any[]>> & import("@ajs/core/beta/decorators").PropertyDecorator & import("@ajs/core/beta/decorators").ParameterDecorator;
export {};
