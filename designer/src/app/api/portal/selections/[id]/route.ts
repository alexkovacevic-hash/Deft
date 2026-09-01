import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, portalGuard } from "@/lib/api";

const schema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(2000).nullable().optional(),
});

/** A client approving or declining a proposed selection from their portal. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await portalGuard();
    const { id } = await params;

    const selection = await prisma.selection.findFirst({
      where: {
        id,
        project: {
          visibleToClient: true,
          clientId: { in: ctx.access.map((a) => a.clientId) },
        },
      },
      include: { project: { select: { clientId: true } } },
    });
    if (!selection) throw new ApiError(404, "Selection not found.");

    const access = ctx.access.find((a) => a.clientId === selection.project.clientId);
    if (!access?.canApproveSelections) throw new ApiError(403, "You cannot approve selections.");
    if (selection.status !== "PROPOSED") {
      throw new ApiError(409, "This item is no longer awaiting your decision.");
    }

    const body = schema.parse(await req.json());
    const updated = await prisma.selection.update({
      where: { id },
      data: {
        status: body.decision,
        clientNote: body.note ?? null,
        decidedAt: new Date(),
        decidedById: ctx.userId,
      },
    });
    return NextResponse.json({ selection: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
