import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'mio_session';
export const GUEST_COOKIE_NAME = 'mio_guest_id';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name?: string | null;
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    return new TextEncoder().encode('mio-studio-dev-secret-key-only-in-development');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload && typeof payload === 'object' && payload.userId) {
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as string,
        name: (payload.name as string) || null,
      };
    }
    return null;
  } catch {
    return null;
  }
}
