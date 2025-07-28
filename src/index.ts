import { JWTHandler, JWTHandlerConfig } from './jwt';
import { ImplementInterface } from '@ajs/core/beta';

let auth: JWTHandler;

export async function construct(config: JWTHandlerConfig): Promise<void> {
  auth = new JWTHandler(config);
  await auth.loadKeys();
  ImplementInterface(await import('@ajs.local/auth/beta'), await import('./implementations/auth/beta'));
}

export function getJWTHandler(): JWTHandler {
  return auth;
}

export function destroy(): void {}

export function start(): void {}

export function stop(): void {}
