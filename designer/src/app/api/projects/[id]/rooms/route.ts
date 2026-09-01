import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, studioGuard } from "@/lib/api";
import { assertProjectAccess } from "@/lib/tenant";

const schema = z.object({ name: z.string().min(1).max(120) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await studioGuard("selections.manage");
    const { id } = await params;
    await assertProjectAccess(ctx, id);

    const { name } = schema.parse(await req.json());
    const count = await prisma.room.count({ where: { projectId: id } });
    const room = await prisma.room.create({
      data: { projectId: id, name: name.trim(), sortOrder: count },
    });
    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
