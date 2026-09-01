import { NextResponse } from "next/server";
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
  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
