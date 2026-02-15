import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'http';
import { SignRaw, ValidateRaw, SignServerResponse, internal } from '@ajs.local/auth/beta';

const HeaderToken = 'header-token-value';
const CookieToken = 'cookie-token-value';
const CookieName = 'set-cookie';

interface AuthPayload {
  userId: string;
  role: string;
}

interface RequestHeaders {
  [key: string]: string | string[] | undefined;
  cookie?: string;
  'x-antelopejs-auth'?: string | string[];
}

interface HeaderStore {
  [key: string]: string;
}

interface ResponseMock {
  serverResponse: ServerResponse;
  getHeader: (name: string) => string | undefined;
}

interface ResponseLike {
  setHeader: (name: string, value: string | number | readonly string[]) => ServerResponse;
}

describe('auth interface', () => {
  it('signs and validates payloads', async () => {
    const payload: AuthPayload = { userId: 'user-42', role: 'admin' };
    const token = await SignRaw(payload);
    const decodedPayload = await ValidateRaw<AuthPayload>(token);
    assert.equal(decodedPayload.userId, payload.userId);
    assert.equal(decodedPayload.role, payload.role);
  });

  it('rejects validation for invalid token', async () => {
    await assert.rejects(() => ValidateRaw('invalid.jwt.token'), isForbiddenError);
  });

  it('extracts token from auth header first', () => {
    const request = createRequest({
      'x-antelopejs-auth': HeaderToken,
      cookie: `ANTELOPEJS_AUTH=${CookieToken}`,
    });
    const token = internal.defaultSource(request, createResponseMock().serverResponse);
    assert.equal(token, HeaderToken);
  });

  it('extracts token from auth cookie when header is absent', () => {
    const request = createRequest({
      cookie: `foo=bar; ANTELOPEJS_AUTH=${CookieToken}; theme=dark`,
    });
    const token = internal.defaultSource(request, createResponseMock().serverResponse);
    assert.equal(token, CookieToken);
  });

  it('sets signed cookie on server response', async () => {
    const response = createResponseMock();
    await SignServerResponse(response.serverResponse, { userId: 'user-7' }, { expiresIn: '1h' }, { httpOnly: true });
    const setCookieHeader = response.getHeader(CookieName);
    assert.ok(setCookieHeader);
    assert.match(setCookieHeader, /^ANTELOPEJS_AUTH=/);
    assert.match(setCookieHeader, /httpOnly=true/);
  });

  it('omits false cookie flags from server response', async () => {
    const response = createResponseMock();
    await SignServerResponse(
      response.serverResponse,
      { userId: 'user-7' },
      { expiresIn: '1h' },
      { httpOnly: false, secure: false, path: '/' },
    );

    const setCookieHeader = response.getHeader(CookieName);
    assert.ok(setCookieHeader);
    assert.doesNotMatch(setCookieHeader, /httpOnly=false/);
    assert.doesNotMatch(setCookieHeader, /secure=false/);
    assert.match(setCookieHeader, /path=\//);
  });

  it('checks authentication with validator callback', async () => {
    const token = await SignRaw({ userId: 'user-20', role: 'editor' });
    const request = createRequest({ 'x-antelopejs-auth': token });
    const role = await internal.CheckAuthentication<AuthPayload, string>(
      request,
      createResponseMock().serverResponse,
      undefined,
      undefined,
      undefined,
      (payload) => payload.role,
    );
    assert.equal(role, 'editor');
  });

  it('rejects missing token in authentication check', async () => {
    await assert.rejects(
      () => internal.CheckAuthentication(createRequest({}), createResponseMock().serverResponse),
      isUnauthorizedError,
    );
  });
});

function createRequest(headers: RequestHeaders): IncomingMessage {
  return { headers } as IncomingMessage;
}

function createResponseMock(): ResponseMock {
  const headers: HeaderStore = {};

  const responseLike: ResponseLike = {
    setHeader(name, value) {
      headers[name.toLowerCase()] = normalizeHeaderValue(value);
      return responseLike as unknown as ServerResponse;
    },
  };

  return {
    serverResponse: responseLike as unknown as ServerResponse,
    getHeader(name: string): string | undefined {
      return headers[name.toLowerCase()];
    },
  };
}

function normalizeHeaderValue(value: string | number | readonly string[]): string {
  if (Array.isArray(value)) {
    return value.join(',');
  }

  return String(value);
}

function isForbiddenError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Forbidden');
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Unauthorized');
}
