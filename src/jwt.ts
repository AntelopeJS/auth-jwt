import { readFile } from "node:fs/promises";
import { HTTPResult } from "@antelopejs/interface-api";
import type {
  AuthClaims,
  AuthPayload,
  JsonObject,
  JsonValue,
} from "@antelopejs/interface-auth";
import {
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

interface ResolvedJWTHandlerConfig {
  loadFromDisk: boolean;
  signKey: string;
  verifyKey: string;
  signOptions: SignOptions;
  verifyOptions: VerifyOptions;
}

function hasSecret(
  config: JWTHandlerConfig,
): config is JWTHandlerConfig & { secret: string } {
  return typeof config.secret === "string";
}

function hasSignAndVerifyKeys(
  config: JWTHandlerConfig,
): config is JWTHandlerConfig & { signKey: string; verifyKey: string } {
  return (
    typeof config.signKey === "string" && typeof config.verifyKey === "string"
  );
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

export class JWTHandler {
  private loadFromDisk: boolean;
  private signKey: string | Buffer;
  private verifyKey: string | Buffer;
  private signOptions: SignOptions;
  private verifyOptions: VerifyOptions;

  constructor(config: JWTHandlerConfig) {
    const resolvedConfig = resolveJWTHandlerConfig(config);
    this.loadFromDisk = resolvedConfig.loadFromDisk;
    this.signKey = resolvedConfig.signKey;
    this.verifyKey = resolvedConfig.verifyKey;
    this.signOptions = resolvedConfig.signOptions;
    this.verifyOptions = resolvedConfig.verifyOptions;
  }

  async loadKeys(): Promise<void> {
    if (!this.loadFromDisk) {
      return;
    }

    const [loadedSignKey, loadedVerifyKey] = await Promise.all([
      readFile(this.signKey),
      readFile(this.verifyKey),
    ]);
    this.signKey = loadedSignKey;
    this.verifyKey = loadedVerifyKey;
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
            reject(
              new HTTPResult(
                ForbiddenStatusCode,
                `${ForbiddenMessagePrefix} (the payload is not a JSON object)`,
              ),
            );
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
