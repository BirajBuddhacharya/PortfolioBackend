import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'google_oauth_state';
const COOKIE_PATH = '/api/v1/auth/google';
const MAX_AGE_MS = 10 * 60 * 1000;

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function signaturesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Stateless OAuth `state` + PKCE verifier store.
 *
 * passport-oauth2's built-in stores need `express-session`, which is a poor fit
 * for a serverless deployment (the callback can land on a different instance).
 * Instead we keep the nonce and PKCE verifier in a short-lived, HMAC-signed,
 * HttpOnly cookie that only this backend can read or forge.
 */
export class SignedCookieOAuthStateStore {
  constructor(
    private readonly secret: string,
    private readonly secure: boolean,
  ) {}

  store(
    req: any,
    verifier: string,
    _state: string | undefined,
    _meta: unknown,
    callback: (err: Error | null, handle?: string) => void,
  ): void {
    const nonce = randomBytes(24).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ n: nonce, v: verifier }),
    ).toString('base64url');
    const value = `${payload}.${sign(payload, this.secret)}`;

    req.res?.cookie?.(COOKIE_NAME, value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.secure,
      maxAge: MAX_AGE_MS,
      path: COOKIE_PATH,
    });

    callback(null, nonce);
  }

  verify(
    req: any,
    providedState: string | undefined,
    _meta: unknown,
    callback: (
      err: Error | null,
      verifier?: string | false,
      state?: string,
    ) => void,
  ): void {
    const raw = parseCookies(req.headers?.cookie)[COOKIE_NAME];
    req.res?.clearCookie?.(COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.secure,
      path: COOKIE_PATH,
    });

    if (!raw) {
      return callback(null, false, undefined);
    }

    const [payload, signature] = raw.split('.');
    if (
      !payload ||
      !signature ||
      !signaturesMatch(sign(payload, this.secret), signature)
    ) {
      return callback(null, false, undefined);
    }

    let data: { n?: string; v?: string };
    try {
      data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      return callback(null, false, undefined);
    }

    if (!data.n || !providedState || data.n !== providedState) {
      return callback(null, false, undefined);
    }

    callback(null, data.v, undefined);
  }
}
