/**
 * The permission catalogue. Roles are rows in the database owned by each
 * organization; the keys they may contain are defined here so the UI can
 * render a role editor and the server can validate what it is given.
 */

export const PERMISSIONS = {
  "clients.view": "View clients",
  "clients.manage": "Create, edit and archive clients",
  "clients.portal": "Manage client portal access",
  "projects.view": "View all projects",
  "projects.view_assigned": "View only projects they lead",
  "projects.manage": "Create and edit projects",
  "projects.delete": "Delete projects",
  "selections.view": "View selections",
  "selections.manage": "Create and edit selections",
  "selections.view_cost": "See item cost and margin",
  "resources.manage": "Share websites and files to the portal",
  "time.log": "Log their own time",
  "time.view_all": "View everyone's time entries",
  "time.manage_all": "Edit and delete everyone's time entries",
  "invoices.view": "View invoices",
  "invoices.manage": "Create, edit and send invoices",
  "payments.record": "Record payments received",
  "members.manage": "Invite and manage team members",
  "roles.manage": "Create and edit roles",
  "settings.manage": "Edit studio settings",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export function isPermission(value: string): value is Permission {
  return value in PERMISSIONS;
}

/** Drops anything that isn't a known permission key, and de-duplicates. */
export function sanitizePermissions(values: unknown): Permission[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter((v): v is Permission => typeof v === "string" && isPermission(v))));
}

/** Groupings used by the role editor. */
export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: "Clients",
    permissions: ["clients.view", "clients.manage", "clients.portal"],
  },
  {
    label: "Projects",
    permissions: ["projects.view", "projects.view_assigned", "projects.manage", "projects.delete"],
  },
  {
    label: "Selections",
    permissions: ["selections.view", "selections.manage", "selections.view_cost", "resources.manage"],
  },
  {
    label: "Time",
    permissions: ["time.log", "time.view_all", "time.manage_all"],
  },
  {
    label: "Billing",
    permissions: ["invoices.view", "invoices.manage", "payments.record"],
  },
  {
    label: "Studio administration",
    permissions: ["members.manage", "roles.manage", "settings.manage"],
  },
];

/**
 * Roles created for a new studio. Studios can rename these, change their
 * permissions, add their own, or delete any of them except the owner role.
 */
export const DEFAULT_ROLES: {
  name: string;
  description: string;
  isOwnerRole?: boolean;
  permissions: Permission[];
}[] = [
  {
    name: "Owner",
    description: "Full access to everything in the studio.",
    isOwnerRole: true,
    permissions: ALL_PERMISSIONS,
  },
  {
    name: "Studio Manager",
    description: "Runs day-to-day operations, billing included.",
    permissions: [
      "clients.view", "clients.manage", "clients.portal",
      "projects.view", "projects.manage",
      "selections.view", "selections.manage", "selections.view_cost", "resources.manage",
      "time.log", "time.view_all", "time.manage_all",
      "invoices.view", "invoices.manage", "payments.record",
      "members.manage",
    ],
  },
  {
    name: "Designer",
    description: "Leads projects and presents selections to clients.",
    permissions: [
      "clients.view", "clients.manage",
      "projects.view", "projects.manage",
      "selections.view", "selections.manage", "selections.view_cost", "resources.manage",
      "time.log",
      "invoices.view",
    ],
  },
  {
    name: "Junior Designer",
    description: "Supports projects they are assigned to.",
    permissions: [
      "clients.view",
      "projects.view_assigned",
      "selections.view", "selections.manage", "resources.manage",
      "time.log",
    ],
  },
  {
    name: "Bookkeeper",
    description: "Handles invoicing and payments only.",
    permissions: [
      "clients.view",
      "projects.view",
      "time.view_all",
      "invoices.view", "invoices.manage", "payments.record",
    ],
  },
];
