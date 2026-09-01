import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/api";
import { ACTIVE_ORG_COOKIE } from "@/lib/tenant";

const schema = z.object({ organizationId: z.string().min(1) });

/** Switches the active studio for a user who belongs to more than one. */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new ApiError(401, "You are not signed in.");

    const { organizationId } = schema.parse(await req.json());
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, organizationId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!membership) throw new ApiError(403, "You are not a member of that studio.");

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ACTIVE_ORG_COOKIE, organizationId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}
