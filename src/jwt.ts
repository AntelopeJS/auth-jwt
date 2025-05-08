import { sign, verify, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { HTTPResult } from '@ajs/api/beta';
import { readFile } from 'fs/promises';

/**
 * Configuration options for the JWT authentication handler.
 *
 * You can either provide a single secret key used for both signing and verification,
 * or separate keys for signing and verification (useful for asymmetric algorithms).
 *
 * @property secret - A single key used for both signing and verification (symmetric)
 * @property signKey - The key or file path used for signing tokens
 * @property verifyKey - The key or file path used for verifying tokens
 * @property signOptions - Options passed to the JWT sign function
 * @property verifyOptions - Options passed to the JWT verify function
 *
 * @example
 * ```typescript
 * // Using a single secret key:
 * const jwtConfig: JWTHandlerConfig = {
 *   secret: 'your-secret-key',
 *   signOptions: { expiresIn: '1d' },
 *   verifyOptions: { ignoreExpiration: false }
 * };
 *
 * // Using separate keys (for RSA algorithm):
 * const jwtAsymmetricConfig: JWTHandlerConfig = {
 *   signKey: '/path/to/private.key',
 *   verifyKey: '/path/to/public.key',
 *   signOptions: { algorithm: 'RS256' }
 * };
 * ```
 */
export interface JWTHandlerConfig {
  secret?: string;
  signKey?: string;
  verifyKey?: string;

  signOptions?: SignOptions;
  verifyOptions?: VerifyOptions;
}

/**
 * Handler for JSON Web Token (JWT) operations including signing and verification.
 *
 * This class provides methods to generate and verify JWT tokens for authentication
 * purposes. It supports both symmetric (single secret key) and asymmetric (public/private key pair)
 * cryptographic methods.
 *
 * @example
 * ```typescript
 * // Create a JWT handler
 * const jwtAuth = new JWTHandler({
 *   secret: process.env.JWT_SECRET,
 *   signOptions: { expiresIn: '12h' }
 * });
 *
 * // Generate a token
 * const token = await jwtAuth.sign({ userId: 123, role: 'admin' });
 *
 * // Verify a token
 * try {
 *   const payload = await jwtAuth.verify(token);
 *   console.log(payload.userId); // 123
 * } catch (error) {
 *   // Handle invalid token
 * }
 * ```
 */
export class JWTHandler {
  private loadFromDisk = false;
  private signKey: string | Buffer;
  private verifyKey: string | Buffer;
  private signOptions: SignOptions;
  private verifyOptions: VerifyOptions;

  /**
   * Creates a new JWT handler with the given configuration.
   *
   * @param config - Configuration options for the JWT handler
   * @throws Error if neither a secret nor both signKey and verifyKey are provided
   */
  constructor(config: JWTHandlerConfig) {
    if (!config.secret && (!config.signKey || !config.verifyKey)) {
      throw new Error('Invalid JWT config');
    }
    if (!config.secret) {
      this.loadFromDisk = true;
    }
    this.signKey = (config.signKey || config.secret)!;
    this.verifyKey = (config.verifyKey || config.secret)!;
    this.signOptions = config.signOptions || {};
    this.verifyOptions = config.verifyOptions || {};
  }

  /**
   * Loads the signing and verification keys from the filesystem.
   * Only called when file paths are provided instead of key strings.
   *
   * @returns A promise that resolves when keys are loaded
   */
  async loadKeys() {
    if (this.loadFromDisk) {
      this.signKey = await readFile(this.signKey);
      this.verifyKey = await readFile(this.verifyKey);
    }
  }

  /**
   * Verifies a JWT token and returns its payload.
   *
   * @param data - The JWT token to verify
   * @param options - Optional verification options that override the defaults
   * @returns A promise resolving to the decoded token payload
   * @throws HTTPResult with 401 status if no token is provided
   * @throws HTTPResult with 403 status if the token is invalid
   *
   * @example
   * ```typescript
   * try {
   *   const userData = await jwtHandler.verify(token, { maxAge: '30m' });
   *   // Token is valid, use userData
   * } catch (error) {
   *   // Handle authentication error
   * }
   * ```
   */
  verify(data: string | undefined, options?: VerifyOptions): Promise<any> {
    return data
      ? new Promise((resolve, reject) =>
          verify(data, this.verifyKey, { ...this.verifyOptions, ...(options || {}) }, (err, encoded) =>
            err ? reject(new HTTPResult(403, `Forbidden (${err.message})`)) : resolve(encoded),
          ),
        )
      : Promise.reject(new HTTPResult(401, 'Unauthorized'));
  }

  /**
   * Signs data to create a JWT token.
   *
   * @param data - The payload to include in the token
   * @param options - Optional signing options that override the defaults
   * @returns A promise resolving to the signed JWT token string
   * @throws Any error that occurs during the signing process
   *
   * @example
   * ```typescript
   * const token = await jwtHandler.sign(
   *   { userId: 123, permissions: ['read', 'write'] },
   *   { expiresIn: '2h' }
   * );
   * // Use the token for authentication
   * ```
   */
  sign(data: string | Buffer | object, options?: SignOptions): Promise<string> {
    return new Promise((resolve, reject) =>
      sign(data, this.signKey, { ...this.signOptions, ...(options || {}) }, (err, encoded) =>
        err ? reject(err) : resolve(encoded!),
      ),
    );
  }
}
