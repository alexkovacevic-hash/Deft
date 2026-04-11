import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const ADMIN_COOKIE = "admin_session";
const SESSION_DURATION = 60 * 60 * 24; // 24 hours in seconds

export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is not set");
    return false;
  }
  return password === adminPassword;
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Store active sessions in memory (sufficient for single-instance dev)
const activeSessions = new Map<string, number>();

export function createSession(): string {
  const token = generateSessionToken();
  activeSessions.set(token, Date.now() + SESSION_DURATION * 1000);
  return token;
}

export function isValidSession(token: string): boolean {
  const expiry = activeSessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return isValidSession(token);
}

export function getAdminTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(ADMIN_COOKIE)?.value ?? null;
}

export { ADMIN_COOKIE, SESSION_DURATION };
