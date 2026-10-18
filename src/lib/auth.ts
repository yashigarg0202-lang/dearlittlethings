import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';
import {
  SESSION_COOKIE_NAME,
  GUEST_COOKIE_NAME,
  type SessionPayload,
  getJwtSecret,
  createSessionToken,
  verifySessionToken,
} from './session';

export {
  SESSION_COOKIE_NAME,
  GUEST_COOKIE_NAME,
  type SessionPayload,
  getJwtSecret,
  createSessionToken,
  verifySessionToken,
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'letmein123',
  'welcome123',
  'studio123',
]);

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, message: 'Password is too common and easily guessed.' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: 'Password must contain at least one letter and one number.' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) {
    return null;
  }
  return verifySessionToken(sessionCookie.value);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mustChangePassword: true,
      createdAt: true,
    },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Unauthorized: Authentication required', 401);
  }
  if (user.role !== 'ADMIN') {
    throw new AuthError('Forbidden: Admin access required', 403);
  }
  return user;
}

export async function getOrCreateGuestId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  if (existing) {
    return existing;
  }
  const newGuestId = `guest_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  return newGuestId;
}
