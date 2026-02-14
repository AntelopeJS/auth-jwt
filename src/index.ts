import { JWTHandler, JWTHandlerConfig } from './jwt';
import { ImplementInterface } from '@ajs/core/beta';

const JWTHandlerNotInitializedError = 'JWT handler is not initialized';

let auth: JWTHandler | undefined;

export async function construct(config: JWTHandlerConfig): Promise<void> {
  auth = new JWTHandler(config);
  await auth.loadKeys();
  ImplementInterface(await import('@ajs.local/auth/beta'), await import('./implementations/auth/beta'));
}

export function getJWTHandler(): JWTHandler {
  if (!auth) {
    throw new Error(JWTHandlerNotInitializedError);
  }

  return auth;
}

export function destroy(): void {
  auth = undefined;
}

export function start(): void {}

export function stop(): void {}
