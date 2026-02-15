import { InterfaceFunction } from '@ajs/core/beta';
import { MakeParameterAndPropertyAndClassDecorator } from '@ajs/core/beta/decorators';
import { IncomingMessage, ServerResponse } from 'http';
import { SetParameterProvider } from '@ajs/api/beta';

const AuthHeaderName = 'x-antelopejs-auth';
const AuthCookieName = 'ANTELOPEJS_AUTH';
const EmptyString = '';
const CookieOptionSeparator = '; ';
const ClassParameterProviderSymbolDescription = 'authentication-class-provider';

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

type AuthPayload = string | Buffer | object;
type VerifyInterfaceHandler = (data?: string, options?: VerifyOptions) => Promise<unknown>;
type SignInterfaceHandler = (data: AuthPayload, options?: SignOptions) => Promise<string>;
type AuthParameterProvider<T, R> = (context: AuthenticationContext) => Promise<T | R>;

interface AuthenticationContext {
  rawRequest: IncomingMessage;
  rawResponse: ServerResponse;
}

interface AuthDecoratorCallbacks<T, R> {
  source?: AuthSource;
  authenticator?: AuthVerifier<T>;
  authenticatorOptions?: VerifyOptions;
  validator?: AuthValidator<T, R>;
}

interface ResolvedAuthDecoratorCallbacks<T, R> {
  source: AuthSource;
  authenticator: AuthVerifier<T>;
  authenticatorOptions: VerifyOptions;
  validator: AuthValidator<T, R> | undefined;
}

interface ClassDecoratorTarget {
  prototype: object;
}

type DecoratorTarget = object;
type DecoratorKey = string | number | symbol | undefined;
type DecoratorIndex = number | undefined;

function readAuthHeader(req: IncomingMessage): string | undefined {
  const header = req.headers[AuthHeaderName];
  if (typeof header === 'string') {
    return header;
  }

  if (!header || header.length === 0) {
    return undefined;
  }

  return header[0];
}

function readCookieToken(req: IncomingMessage): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const cookieMatch = ` ${cookieHeader}`.match(/ ANTELOPEJS_AUTH=([^;]*)/);
  return cookieMatch?.[1];
}

function serializeCookieOptions(cookieOptions?: CookieOptions): string {
  if (!cookieOptions) {
    return EmptyString;
  }

  const entries = Object.entries(cookieOptions).filter(([, value]) => value !== undefined && value !== false);
  if (entries.length === 0) {
    return EmptyString;
  }

  return entries
    .map(([key, value]) => (typeof value === 'boolean' ? key : `${key}=${String(value)}`))
    .join(CookieOptionSeparator);
}

function createSetCookieHeader(token: string, cookieOptions?: CookieOptions): string {
  const serializedCookieOptions = serializeCookieOptions(cookieOptions);
  if (!serializedCookieOptions) {
    return `${AuthCookieName}=${token}`;
  }

  return `${AuthCookieName}=${token}; ${serializedCookieOptions}`;
}

function resolveAuthDecoratorCallbacks<T, R>(
  callbacks: AuthDecoratorCallbacks<T, R>,
): ResolvedAuthDecoratorCallbacks<T, R> {
  return {
    source: callbacks.source ?? internal.defaultSource,
    authenticator: callbacks.authenticator ?? (internal.defaultAuthenticator as AuthVerifier<T>),
    authenticatorOptions: callbacks.authenticatorOptions ?? {},
    validator: callbacks.validator,
  };
}

function createAuthParameterProvider<T, R>(
  callbacks: ResolvedAuthDecoratorCallbacks<T, R>,
  validator?: AuthValidator<T, R>,
): AuthParameterProvider<T, R> {
  return (context: AuthenticationContext) =>
    internal.CheckAuthentication(
      context.rawRequest,
      context.rawResponse,
      callbacks.source,
      callbacks.authenticator,
      callbacks.authenticatorOptions,
      validator,
    );
}

function registerClassParameterProvider<T, R>(
  target: ClassDecoratorTarget,
  provider: AuthParameterProvider<T, R>,
): void {
  SetParameterProvider(target.prototype, Symbol(ClassParameterProviderSymbolDescription), undefined, provider);
}

export namespace internal {
  export const Verify = InterfaceFunction<VerifyInterfaceHandler>();
  export const Sign = InterfaceFunction<SignInterfaceHandler>();

  export function defaultSource(req: IncomingMessage, _res: ServerResponse): string | undefined {
    return readAuthHeader(req) ?? readCookieToken(req);
  }

  export const defaultAuthenticator: AuthVerifier<unknown> = ValidateRaw;

  export async function CheckAuthentication<T = unknown, R = unknown>(
    req: IncomingMessage,
    res: ServerResponse,
    source: AuthSource = defaultSource,
    authenticator: AuthVerifier<T> = defaultAuthenticator as AuthVerifier<T>,
    authenticatorOptions: VerifyOptions = {},
    validator?: AuthValidator<T, R>,
  ): Promise<T | R> {
    const verifiedData = await authenticator(source(req, res), authenticatorOptions);
    if (!validator) {
      return verifiedData;
    }

    return validator(verifiedData);
  }
}

export function ValidateRaw<T = unknown>(token?: string, options?: VerifyOptions): Promise<T> {
  return internal.Verify(token, options) as Promise<T>;
}

export function SignRaw(data: AuthPayload, options?: SignOptions): Promise<string> {
  return internal.Sign(data, options);
}

export function SignServerResponse(
  res: ServerResponse,
  data: AuthPayload,
  signOptions?: SignOptions,
  cookieOptions?: CookieOptions,
): Promise<ServerResponse> {
  return SignRaw(data, signOptions).then((token) => {
    res.setHeader('Set-Cookie', createSetCookieHeader(token, cookieOptions));
    return res;
  });
}

export function CreateAuthDecorator<R = unknown, T = unknown>(callbacks: AuthDecoratorCallbacks<T, R>) {
  const resolvedCallbacks = resolveAuthDecoratorCallbacks(callbacks);

  return MakeParameterAndPropertyAndClassDecorator(
    (target: DecoratorTarget, key: DecoratorKey, index: DecoratorIndex, validator?: AuthValidator<T, R>) => {
      const authValidator = validator ?? resolvedCallbacks.validator;
      const provider = createAuthParameterProvider(resolvedCallbacks, authValidator);

      if (key === undefined) {
        registerClassParameterProvider(target as ClassDecoratorTarget, provider);
        return;
      }

      SetParameterProvider(target, key, index, provider);
    },
  );
}

export const Authentication = CreateAuthDecorator({});
