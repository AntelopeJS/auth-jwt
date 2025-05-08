import { IncomingMessage, ServerResponse } from 'http';
export declare namespace internal {
    const Verify: (data?: string | undefined, options?: VerifyOptions | undefined) => Promise<any>;
    const Sign: (data: string | object | Buffer<ArrayBufferLike>, options?: SignOptions | undefined) => Promise<string>;
    function defaultSource(req: IncomingMessage): string | undefined;
    const defaultAuthenticator: AuthVerifier<any>;
    function CheckAuthentication<T = unknown, R = unknown>(req: IncomingMessage, res: ServerResponse, source?: AuthSource | undefined, authenticator?: AuthVerifier<T> | undefined, authenticatorOptions?: VerifyOptions | undefined, validator?: AuthValidator<T, R> | undefined): Promise<any>;
}
export type AuthSource = (req: IncomingMessage, res: ServerResponse) => string | undefined;
export type AuthVerifier<T = unknown> = (data?: string, options?: VerifyOptions) => Promise<T> | T;
export type AuthValidator<T = unknown, R = unknown> = (data: T) => Promise<R> | R;
export interface CookieOptions {
    maxAge?: number;
    signed?: boolean;
    expires?: Date;
    httpOnly?: boolean;
    path?: string;
    domain?: string;
    secure?: boolean;
}
export interface SignOptions {
    expiresIn?: string | number;
    notBefore?: string | number;
}
export interface VerifyOptions {
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    maxAge?: string | number;
}
export declare function ValidateRaw<T = any>(token: string, options?: VerifyOptions): Promise<T>;
export declare function SignRaw(data: string | Buffer | object, options?: SignOptions): Promise<string>;
export declare function SignServerResponse(res: ServerResponse, data: string | Buffer | object, signOptions?: SignOptions, cookieOptions?: CookieOptions): Promise<ServerResponse<IncomingMessage>>;
export declare function CreateAuthDecorator<R = unknown, T = unknown>(callbacks: {
    source?: AuthSource;
    authenticator?: AuthVerifier<T>;
    authenticatorOptions?: VerifyOptions;
    validator?: AuthValidator<T, R>;
}): (validator?: AuthValidator<T, R> | undefined) => import("@ajs/core/beta/decorators").ClassDecorator<import("@ajs/core/beta/decorators").Class<any, any[]>> & import("@ajs/core/beta/decorators").PropertyDecorator & import("@ajs/core/beta/decorators").MethodDecorator & import("@ajs/core/beta/decorators").ParameterDecorator;
export declare const Authentication: (validator?: AuthValidator<unknown, unknown> | undefined) => import("@ajs/core/beta/decorators").ClassDecorator<import("@ajs/core/beta/decorators").Class<any, any[]>> & import("@ajs/core/beta/decorators").PropertyDecorator & import("@ajs/core/beta/decorators").MethodDecorator & import("@ajs/core/beta/decorators").ParameterDecorator;
