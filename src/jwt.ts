import {
  createPrivateKey,
  createPublicKey,
  createSecretKey,
  type KeyObject,
} from "node:crypto";
import { readFile } from "node:fs/promises";
import { HTTPResult } from "@antelopejs/interface-api";
import type {
  AuthClaims,
  AuthPayload,
  JsonObject,
  JsonValue,
} from "@antelopejs/interface-auth";
import {
  decode,
  type SignOptions,
  sign,
  type VerifyOptions,
  verify,
} from "jsonwebtoken";

const ForbiddenStatusCode = 403;
const UnauthorizedStatusCode = 401;
const UnauthorizedMessage = "Unauthorized";
const ForbiddenMessagePrefix = "Forbidden";
const JWTSignFailureMessage = "Unable to sign JWT";
const NotJsonObjectMessage = `${ForbiddenMessagePrefix} (the payload is not a JSON object)`;

export interface JWTHandlerConfig {
  secret?: string;
  signKey?: string;
  verifyKey?: string;
  signOptions?: SignOptions;
  verifyOptions?: VerifyOptions;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  return isJsonObject(value);
}

function isJsonObject(value: unknown): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(isJsonValue)
  );
}

/**
 * What jsonwebtoken decodes from a token is the signed string, or the parsed
 * claims set. RFC 7519 defines the claims set as a JSON object, so a payload
 * that parses to an array or a scalar is refused.
 */
function isAuthClaims(payload: unknown): payload is AuthClaims {
  return typeof payload === "string" || isJsonObject(payload);
}

/**
 * jsonwebtoken reads `payload.nbf` on a JSON null payload and throws instead of
 * calling back, so such a token is refused before it reaches `verify`. A token
 * that does not decode is left to `verify`, which reports it as a 403.
 */
function hasNullPayload(token: string): boolean {
  try {
    return decode(token, { complete: true })?.payload === null;
  } catch {
    return false;
  }
}

interface ResolvedJWTHandlerConfig {
  loadFromDisk: boolean;
  signKey: string;
  verifyKey: string;
  signOptions: SignOptions;
  verifyOptions: VerifyOptions;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

function hasSecret(
  config: JWTHandlerConfig,
): config is JWTHandlerConfig & { secret: string } {
  return isNonEmptyString(config.secret);
}

function hasSignAndVerifyKeys(
  config: JWTHandlerConfig,
): config is JWTHandlerConfig & { signKey: string; verifyKey: string } {
  return isNonEmptyString(config.signKey) && isNonEmptyString(config.verifyKey);
}

function resolveJWTHandlerConfig(
  config: JWTHandlerConfig,
): ResolvedJWTHandlerConfig {
  const usesSecret = hasSecret(config);
  const usesSignAndVerifyKeys = hasSignAndVerifyKeys(config);

  if (!usesSecret && !usesSignAndVerifyKeys) {
    throw new Error("Invalid JWT config");
  }

  if (usesSecret) {
    return {
      loadFromDisk: false,
      signKey: config.secret,
      verifyKey: config.secret,
      signOptions: config.signOptions ?? {},
      verifyOptions: config.verifyOptions ?? {},
    };
  }

  return {
    loadFromDisk: true,
    signKey: config.signKey,
    verifyKey: config.verifyKey,
    signOptions: config.signOptions ?? {},
    verifyOptions: config.verifyOptions ?? {},
  };
}

function mergeSignOptions(
  baseOptions: SignOptions,
  overrideOptions?: SignOptions,
): SignOptions {
  if (!overrideOptions) {
    return baseOptions;
  }

  return { ...baseOptions, ...overrideOptions };
}

function mergeVerifyOptions(
  baseOptions: VerifyOptions,
  overrideOptions?: VerifyOptions,
): VerifyOptions {
  if (!overrideOptions) {
    return baseOptions;
  }

  return { ...baseOptions, ...overrideOptions };
}

/**
 * jsonwebtoken resolves string or Buffer key material the same way on every
 * call: it tries an asymmetric key, then falls back to a secret. Resolving it
 * once here spares each sign and verify the failed parse.
 */
function signingKey(material: string | Buffer): KeyObject {
  try {
    return createPrivateKey(material);
  } catch {
    return createSecretKey(Buffer.from(material));
  }
}

function verificationKey(material: string | Buffer): KeyObject {
  try {
    return createPublicKey(material);
  } catch {
    return createSecretKey(Buffer.from(material));
  }
}

export class JWTHandler {
  private keyFiles: { signKey: string; verifyKey: string } | undefined;
  private signKey: KeyObject;
  private verifyKey: KeyObject;
  private signOptions: SignOptions;
  private verifyOptions: VerifyOptions;

  constructor(config: JWTHandlerConfig) {
    const resolvedConfig = resolveJWTHandlerConfig(config);
    this.keyFiles = resolvedConfig.loadFromDisk ? resolvedConfig : undefined;
    this.signKey = signingKey(resolvedConfig.signKey);
    this.verifyKey = verificationKey(resolvedConfig.verifyKey);
    this.signOptions = resolvedConfig.signOptions;
    this.verifyOptions = resolvedConfig.verifyOptions;
  }

  async loadKeys(): Promise<void> {
    if (!this.keyFiles) {
      return;
    }

    const [loadedSignKey, loadedVerifyKey] = await Promise.all([
      readFile(this.keyFiles.signKey),
      readFile(this.keyFiles.verifyKey),
    ]);
    this.signKey = signingKey(loadedSignKey);
    this.verifyKey = verificationKey(loadedVerifyKey);
  }

  verify(
    data: string | undefined,
    options?: VerifyOptions,
  ): Promise<AuthClaims> {
    if (!data) {
      return Promise.reject(
        new HTTPResult(UnauthorizedStatusCode, UnauthorizedMessage),
      );
    }

    if (hasNullPayload(data)) {
      return Promise.reject(
        new HTTPResult(ForbiddenStatusCode, NotJsonObjectMessage),
      );
    }

    return new Promise((resolve, reject) => {
      verify(
        data,
        this.verifyKey,
        mergeVerifyOptions(this.verifyOptions, options),
        (error, payload) => {
          if (error) {
            reject(
              new HTTPResult(
                ForbiddenStatusCode,
                `${ForbiddenMessagePrefix} (${error.message})`,
              ),
            );
            return;
          }

          if (!isAuthClaims(payload)) {
            reject(new HTTPResult(ForbiddenStatusCode, NotJsonObjectMessage));
            return;
          }

          resolve(payload);
        },
      );
    });
  }

  sign(data: AuthPayload, options?: SignOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      sign(
        data,
        this.signKey,
        mergeSignOptions(this.signOptions, options),
        (error, token) => {
          if (error || !token) {
            reject(error ?? new Error(JWTSignFailureMessage));
            return;
          }

          resolve(token);
        },
      );
    });
  }
}
