import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { getPortalContext, getStudioContext, can, type PortalContext, type StudioContext } from "./tenant";
import type { Permission } from "./permissions";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Route-handler guard. Returns the studio context or throws an ApiError. */
export async function studioGuard(permission?: Permission | Permission[]): Promise<StudioContext> {
  const ctx = await getStudioContext();
  if (!ctx) throw new ApiError(401, "You are not signed in to a studio.");
  if (permission && !can(ctx, permission)) {
    throw new ApiError(403, "Your role does not allow this action.");
  }
  return ctx;
}

/** Route-handler guard for client portal users. */
export async function portalGuard(): Promise<PortalContext> {
  const ctx = await getPortalContext();
  if (!ctx || ctx.access.length === 0) throw new ApiError(401, "You do not have portal access.");
  return ctx;
}

export function portalClientIds(ctx: PortalContext): string[] {
  return ctx.access.map((a) => a.clientId);
}

/**
 * Turns the database failures that actually happen on a deploy into messages
 * that name the fix. Without this they all surface as a bare 500, which tells
 * whoever deployed the app nothing at all.
 *
 * Prisma 6 leaves `errorCode` unset on initialization errors, so the cause has
 * to be read from the message. The host and connection string never reach the
 * response — these endpoints are public — but the full error is logged.
 */
function describeInitializationError(message: string): string {
  if (message.includes("Environment variable not found")) {
    return "DATABASE_URL isn't set in this environment. Add it to the deployment's environment variables and redeploy — variables added after a build only take effect on the next one.";
  }
  if (message.includes("Can't reach database server")) {
    return "The database server isn't reachable from the app. On a serverless host use your provider's pooled connection string for DATABASE_URL: direct connections are often blocked or IPv6-only, and pooling is what serverless needs anyway.";
  }
  if (message.includes("does not exist")) {
    return "The database named in DATABASE_URL doesn't exist on that server. Check the database name at the end of the connection string.";
  }
  if (message.includes("Authentication failed")) {
    return "The database rejected the credentials in DATABASE_URL. Check the username and password, and that any special characters in the password are URL-encoded.";
  }
  if (message.includes("must start with the protocol") || message.includes("Error validating datasource")) {
    return "DATABASE_URL isn't a valid PostgreSQL connection string — it must start with postgresql://.";
  }
  return "The app can't open a connection to its database. Check DATABASE_URL for this environment; the deployment logs carry the underlying error.";
}

function describeDatabaseError(error: unknown): { status: number; message: string } | null {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return { status: 503, message: describeInitializationError(error.message) };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2021":
      case "P2022":
        return {
          status: 503,
          message:
            "The database is reachable but its tables are missing. Apply the schema with `npx prisma migrate deploy`, then try again.",
        };
      case "P1001":
      case "P1017":
        return {
          status: 503,
          message: "The database refused the connection. Check DATABASE_URL and that the server is reachable.",
        };
      case "P2002":
        return { status: 409, message: "That value is already taken." };
      case "P2003":
        return { status: 422, message: "That record refers to something that no longer exists." };
      case "P2025":
        return { status: 404, message: "That record no longer exists." };
    }
  }
  return null;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request.", issues: error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  if (error instanceof Error && error.message === "PROJECT_NOT_FOUND") {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const described = describeDatabaseError(error);
  if (described) {
    console.error(error);
    return NextResponse.json({ error: described.message }, { status: described.status });
  }

  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
