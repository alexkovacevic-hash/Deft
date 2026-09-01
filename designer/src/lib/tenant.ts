import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { sanitizePermissions, type Permission } from "./permissions";

export const ACTIVE_ORG_COOKIE = "deft_org";

export type StudioContext = {
  userId: string;
  userName: string | null;
  userEmail: string;
  membershipId: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    accentColor: string;
    defaultHourlyRate: Prisma.Decimal;
    invoicePrefix: string;
    logoUrl: string | null;
  };
  roleName: string;
  isOwner: boolean;
  permissions: Permission[];
  /** Other studios this user belongs to, for the workspace switcher. */
  organizations: { id: string; name: string; slug: string }[];
};

export type PortalContext = {
  userId: string;
  userName: string | null;
  userEmail: string;
  access: {
    clientId: string;
    clientName: string;
    organizationId: string;
    organizationName: string;
    currency: string;
    accentColor: string;
    logoUrl: string | null;
    canApproveSelections: boolean;
    canViewInvoices: boolean;
    canPayInvoices: boolean;
  }[];
};

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Resolves the caller's active studio membership, or null when they are signed
 * out or have no studio membership (a client-portal-only user).
 */
export async function getStudioContext(): Promise<StudioContext | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const memberships = await prisma.membership.findMany({
    where: { userId, status: "ACTIVE" },
    include: { organization: true, role: true, user: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) return null;

  const store = await cookies();
  const preferred = store.get(ACTIVE_ORG_COOKIE)?.value;
  const membership =
    memberships.find((m) => m.organizationId === preferred) ?? memberships[0];

  return {
    userId,
    userName: membership.user.name,
    userEmail: membership.user.email,
    membershipId: membership.id,
    organizationId: membership.organizationId,
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      currency: membership.organization.currency,
      accentColor: membership.organization.accentColor,
      defaultHourlyRate: membership.organization.defaultHourlyRate,
      invoicePrefix: membership.organization.invoicePrefix,
      logoUrl: membership.organization.logoUrl,
    },
    roleName: membership.role.name,
    isOwner: membership.role.isOwnerRole,
    permissions: sanitizePermissions(membership.role.permissions),
    organizations: memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
    })),
  };
}

export function can(ctx: StudioContext | null, permission: Permission | Permission[]): boolean {
  if (!ctx) return false;
  if (ctx.isOwner) return true;
  const wanted = Array.isArray(permission) ? permission : [permission];
  return wanted.some((p) => ctx.permissions.includes(p));
}

/** Server-component guard: bounces to sign-in, the portal, or a 403 page. */
export async function requireStudio(permission?: Permission | Permission[]): Promise<StudioContext> {
  const ctx = await getStudioContext();
  if (!ctx) {
    const userId = await currentUserId();
    redirect(userId ? "/portal" : "/signin");
  }
  if (permission && !can(ctx, permission)) redirect("/studio/no-access");
  return ctx;
}

/** Resolves every client portal this user can see. */
export async function getPortalContext(): Promise<PortalContext | null> {
  const userId = await currentUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      clientAccess: {
        include: { client: { include: { organization: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user) return null;

  return {
    userId,
    userName: user.name,
    userEmail: user.email,
    access: user.clientAccess.map((a) => ({
      clientId: a.clientId,
      clientName: a.client.name,
      organizationId: a.client.organizationId,
      organizationName: a.client.organization.name,
      currency: a.client.organization.currency,
      accentColor: a.client.organization.accentColor,
      logoUrl: a.client.organization.logoUrl,
      canApproveSelections: a.canApproveSelections,
      canViewInvoices: a.canViewInvoices,
      canPayInvoices: a.canPayInvoices,
    })),
  };
}

export async function requirePortal(): Promise<PortalContext> {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/signin");
  if (ctx.access.length === 0) redirect("/portal/no-access");
  return ctx;
}

/**
 * Project filter for the caller. A member with only `projects.view_assigned`
 * sees the projects they lead; `projects.view` sees the whole studio.
 */
export function projectScope(ctx: StudioContext): Prisma.ProjectWhereInput {
  const base: Prisma.ProjectWhereInput = { organizationId: ctx.organizationId };
  if (can(ctx, "projects.view")) return base;
  return { ...base, leadUserId: ctx.userId };
}

/** Throws if the project isn't in the caller's studio and visible to them. */
export async function assertProjectAccess(ctx: StudioContext, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, ...projectScope(ctx) } });
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  return project;
}
