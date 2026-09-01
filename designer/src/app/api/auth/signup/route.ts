import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api";
import { DEFAULT_ROLES } from "@/lib/permissions";
import { slugify } from "@/lib/utils";

const schema = z.object({
  studioName: z.string().min(2).max(120),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters."),
});

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "studio";
  for (let i = 0; i < 100; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    const taken = await prisma.organization.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
  return `${root}-${Date.now()}`;
}

/** Creates a studio, its default roles, the owner user and their membership. */
export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.hashedPassword) {
      return NextResponse.json(
        { error: "An account with that email already exists. Sign in instead." },
        { status: 409 }
      );
    }

    const slug = await uniqueSlug(body.studioName);
    const hashedPassword = await bcrypt.hash(body.password, 12);

    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: body.studioName.trim(), slug },
      });

      await tx.role.createMany({
        data: DEFAULT_ROLES.map((role) => ({
          organizationId: org.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSystem: true,
          isOwnerRole: Boolean(role.isOwnerRole),
        })),
      });

      const ownerRole = await tx.role.findFirstOrThrow({
        where: { organizationId: org.id, isOwnerRole: true },
      });

      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: { hashedPassword, name: existing.name ?? body.name.trim() },
          })
        : await tx.user.create({
            data: { email, name: body.name.trim(), hashedPassword },
          });

      await tx.membership.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: ownerRole.id,
          title: "Founder",
        },
      });

      return org;
    });

    return NextResponse.json({ organizationId: organization.id, slug: organization.slug }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
