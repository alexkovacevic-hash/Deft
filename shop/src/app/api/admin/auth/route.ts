import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPassword,
  createSession,
  getAdminTokenFromRequest,
  destroySession,
  isValidSession,
  ADMIN_COOKIE,
  SESSION_DURATION,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  if (!password || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createSession();
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  if (token) {
    destroySession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const token = getAdminTokenFromRequest(request);
  const authenticated = token ? isValidSession(token) : false;
  return NextResponse.json({ authenticated });
}
