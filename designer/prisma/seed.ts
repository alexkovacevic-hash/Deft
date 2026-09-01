/**
 * Seeds a demo studio so the app can be explored end to end.
 * Run with `npm run db:seed`. Safe to re-run: it clears the demo org first.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLES } from "../src/lib/permissions";

const prisma = new PrismaClient();
const SLUG = "atelier-nord";
const PASSWORD = "designdemo123";

const dec = (n: number) => new Prisma.Decimal(n);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);

async function upsertUser(email: string, name: string) {
  const hashedPassword = await bcrypt.hash(PASSWORD, 12);
  return prisma.user.upsert({
    where: { email },
    update: { name, hashedPassword },
    create: { email, name, hashedPassword },
  });
}

async function main() {
  await prisma.organization.deleteMany({ where: { slug: SLUG } });

  const org = await prisma.organization.create({
    data: {
      name: "Atelier Nord",
      slug: SLUG,
      currency: "USD",
      defaultHourlyRate: dec(185),
      invoicePrefix: "AN",
      invoiceTerms: "Payment due within 14 days. Items are ordered once approved and invoiced.",
      city: "Portland",
      state: "OR",
      phone: "(503) 555-0142",
    },
  });

  await prisma.role.createMany({
    data: DEFAULT_ROLES.map((role) => ({
      organizationId: org.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isSystem: true,
      isOwnerRole: Boolean(role.isOwnerRole),
    })),
  });
  const roles = await prisma.role.findMany({ where: { organizationId: org.id } });
  const roleByName = (name: string) => roles.find((r) => r.name === name)!;

  const [owner, designer, junior, bookkeeper] = await Promise.all([
    upsertUser("maren@ateliernord.test", "Maren Holt"),
    upsertUser("dev@ateliernord.test", "Devon Ricci"),
    upsertUser("sana@ateliernord.test", "Sana Iyer"),
    upsertUser("books@ateliernord.test", "Paul Okafor"),
  ]);

  await prisma.membership.createMany({
    data: [
      { organizationId: org.id, userId: owner.id, roleId: roleByName("Owner").id, title: "Principal" },
      {
        organizationId: org.id,
        userId: designer.id,
        roleId: roleByName("Designer").id,
        title: "Senior Designer",
        hourlyRate: dec(165),
      },
      {
        organizationId: org.id,
        userId: junior.id,
        roleId: roleByName("Junior Designer").id,
        title: "Design Assistant",
        hourlyRate: dec(95),
      },
      { organizationId: org.id, userId: bookkeeper.id, roleId: roleByName("Bookkeeper").id },
    ],
  });

  // ---- Clients -----------------------------------------------------------
  const ellsworth = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: "The Ellsworth Residence",
      contactName: "Nadia Ellsworth",
      email: "nadia@ellsworth.test",
      phone: "(503) 555-0188",
      addressLine1: "2214 NE Klickitat St",
      city: "Portland",
      state: "OR",
      postalCode: "97212",
      notes: "Loves warm neutrals, allergic to wool. Two cats.",
    },
  });

  const brightwater = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: "Brightwater Hospitality",
      contactName: "Theo Marsh",
      email: "theo@brightwater.test",
      city: "Seattle",
      state: "WA",
      notes: "Boutique hotel group. Fast decisions, tight budgets.",
    },
  });

  const nadia = await upsertUser("nadia@ellsworth.test", "Nadia Ellsworth");
  const theo = await upsertUser("theo@brightwater.test", "Theo Marsh");
  await prisma.clientUser.createMany({
    data: [
      { clientId: ellsworth.id, userId: nadia.id },
      { clientId: brightwater.id, userId: theo.id, canPayInvoices: false },
    ],
  });

  // ---- Projects ----------------------------------------------------------
  const mainHouse = await prisma.project.create({
    data: {
      organizationId: org.id,
      clientId: ellsworth.id,
      name: "Whole-home refresh",
      description: "Living, dining and primary suite. Keep the millwork, replace everything soft.",
      status: "ACTIVE",
      startDate: daysAgo(48),
      targetDate: daysAhead(60),
      budget: dec(145_000),
      leadUserId: designer.id,
    },
  });

  const kitchen = await prisma.project.create({
    data: {
      organizationId: org.id,
      clientId: ellsworth.id,
      name: "Kitchen remodel",
      description: "Completed last spring — cabinetry, lighting and stone.",
      status: "COMPLETED",
      startDate: daysAgo(400),
      targetDate: daysAgo(250),
      completedAt: daysAgo(243),
      budget: dec(88_000),
      leadUserId: owner.id,
    },
  });

  const lobby = await prisma.project.create({
    data: {
      organizationId: org.id,
      clientId: brightwater.id,
      name: "Cedar & Vine lobby",
      description: "38-key boutique property. Lobby, lounge and check-in.",
      status: "PROPOSAL",
      startDate: daysAgo(12),
      targetDate: daysAhead(120),
      budget: dec(210_000),
      leadUserId: owner.id,
    },
  });

  const [living, dining, primary] = await Promise.all([
    prisma.room.create({ data: { projectId: mainHouse.id, name: "Living room", sortOrder: 0 } }),
    prisma.room.create({ data: { projectId: mainHouse.id, name: "Dining room", sortOrder: 1 } }),
    prisma.room.create({ data: { projectId: mainHouse.id, name: "Primary suite", sortOrder: 2 } }),
  ]);

  // ---- Selections --------------------------------------------------------
  await prisma.selection.createMany({
    data: [
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        roomId: living.id,
        name: 'Ludlow sofa, 96"',
        vendor: "Verellen",
        sku: "LUD-96-BOU",
        description: "Bouclé in oat, feather-down seat. The anchor for the room.",
        quantity: 1,
        unitCost: dec(4_200),
        unitPrice: dec(6_300),
        leadTimeWeeks: 14,
        status: "APPROVED",
        decidedAt: daysAgo(20),
        decidedById: nadia.id,
        sortOrder: 0,
      },
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        roomId: living.id,
        name: "Pair of Foley lounge chairs",
        vendor: "Lawson-Fenning",
        quantity: 2,
        unitCost: dec(1_850),
        unitPrice: dec(2_775),
        leadTimeWeeks: 10,
        status: "PROPOSED",
        designerNote: "Second choice if the walnut reads too dark: the ash frame.",
        sortOrder: 1,
      },
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        roomId: dining.id,
        name: 'Solid oak trestle table, 108"',
        vendor: "BDDW",
        quantity: 1,
        unitCost: dec(9_400),
        unitPrice: dec(13_100),
        leadTimeWeeks: 22,
        status: "PROPOSED",
        sortOrder: 2,
      },
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        roomId: dining.id,
        name: "Linen dining chairs, set of 8",
        vendor: "Serena & Lily",
        quantity: 8,
        unitCost: dec(495),
        unitPrice: dec(720),
        leadTimeWeeks: 6,
        status: "ORDERED",
        decidedAt: daysAgo(15),
        decidedById: nadia.id,
        sortOrder: 3,
      },
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        roomId: primary.id,
        name: "Custom upholstered headboard",
        vendor: "Atelier Nord workroom",
        quantity: 1,
        unitCost: dec(2_100),
        unitPrice: dec(3_400),
        leadTimeWeeks: 8,
        status: "PROPOSED",
        sortOrder: 4,
      },
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        roomId: primary.id,
        name: "Wool-free flatweave rug, 9x12",
        vendor: "Armadillo",
        quantity: 1,
        unitCost: dec(1_950),
        unitPrice: dec(2_800),
        status: "DRAFT",
        designerNote: "Confirm the jute blend is fine given the cat allergy.",
        sortOrder: 5,
      },
      {
        organizationId: org.id,
        projectId: lobby.id,
        name: "Reception desk, quartered white oak",
        vendor: "Millwork partner",
        quantity: 1,
        unitCost: dec(14_000),
        unitPrice: dec(19_500),
        leadTimeWeeks: 16,
        status: "PROPOSED",
        sortOrder: 0,
      },
    ],
  });

  // ---- Shared websites ---------------------------------------------------
  await prisma.sharedResource.createMany({
    data: [
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        title: "Living room direction — warm minimal",
        url: "https://www.pinterest.com/",
        description: "The mood we're chasing: oat, bone, walnut, one black accent per room.",
        category: "MOODBOARD",
        createdById: designer.id,
      },
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        title: "Verellen — Ludlow collection",
        url: "https://verellen.biz/",
        description: "The sofa we've specified, plus the frame options.",
        category: "VENDOR",
        createdById: designer.id,
      },
      {
        organizationId: org.id,
        clientId: ellsworth.id,
        title: "Care and cleaning for bouclé",
        url: "https://www.thespruce.com/",
        description: "Worth a read before the sofa lands.",
        category: "DOCUMENT",
        createdById: owner.id,
      },
    ],
  });

  // ---- Time --------------------------------------------------------------
  await prisma.timeEntry.createMany({
    data: [
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        userId: designer.id,
        workDate: daysAgo(30),
        minutes: 240,
        description: "Site measure and existing conditions survey",
        hourlyRate: dec(165),
        invoicedAt: daysAgo(20),
      },
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        userId: designer.id,
        workDate: daysAgo(18),
        minutes: 180,
        description: "Sourcing seating for the living room",
        hourlyRate: dec(165),
      },
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        userId: junior.id,
        workDate: daysAgo(11),
        minutes: 300,
        description: "Building the dining and primary boards",
        hourlyRate: dec(95),
      },
      {
        organizationId: org.id,
        projectId: mainHouse.id,
        userId: designer.id,
        workDate: daysAgo(4),
        minutes: 90,
        description: "Client presentation and revisions",
        hourlyRate: dec(165),
      },
      {
        organizationId: org.id,
        projectId: lobby.id,
        userId: owner.id,
        workDate: daysAgo(6),
        minutes: 420,
        description: "Concept development for the lobby and lounge",
        hourlyRate: dec(185),
      },
    ],
  });

  // ---- Invoices ----------------------------------------------------------
  const paidInvoice = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: ellsworth.id,
      projectId: mainHouse.id,
      number: "AN-0001",
      status: "PAID",
      issueDate: daysAgo(21),
      dueDate: daysAgo(7),
      sentAt: daysAgo(21),
      paidAt: daysAgo(9),
      notes: "Initial design fee and site survey.",
      subtotal: dec(4_160),
      taxRate: dec(0),
      taxAmount: dec(0),
      total: dec(4_160),
      amountPaid: dec(4_160),
      lineItems: {
        create: [
          {
            kind: "TIME",
            description: "Site measure and existing conditions survey",
            quantity: dec(4),
            unitPrice: dec(165),
            amount: dec(660),
            sortOrder: 0,
          },
          {
            kind: "CUSTOM",
            description: "Design retainer — phase one",
            quantity: dec(1),
            unitPrice: dec(3_500),
            amount: dec(3_500),
            sortOrder: 1,
          },
        ],
      },
      payments: {
        create: {
          amount: dec(4_160),
          method: "ACH",
          reference: "ACH-88213",
          paidAt: daysAgo(9),
          recordedById: bookkeeper.id,
        },
      },
    },
  });

  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: ellsworth.id,
      projectId: mainHouse.id,
      number: "AN-0002",
      status: "SENT",
      issueDate: daysAgo(5),
      dueDate: daysAhead(9),
      sentAt: daysAgo(5),
      notes: "Approved furnishings — deposit due to place the orders.",
      subtotal: dec(12_060),
      taxRate: dec(0),
      taxAmount: dec(0),
      total: dec(12_060),
      amountPaid: dec(0),
      lineItems: {
        create: [
          {
            kind: "ITEM",
            description: 'Ludlow sofa, 96" (Verellen)',
            quantity: dec(1),
            unitPrice: dec(6_300),
            amount: dec(6_300),
            sortOrder: 0,
          },
          {
            kind: "ITEM",
            description: "Linen dining chairs, set of 8 (Serena & Lily)",
            quantity: dec(8),
            unitPrice: dec(720),
            amount: dec(5_760),
            sortOrder: 1,
          },
        ],
      },
    },
  });

  console.log(`Seeded ${org.name}.`);
  console.log(`  Studio owner:   ${owner.email} / ${PASSWORD}`);
  console.log(`  Designer:       ${designer.email} / ${PASSWORD}`);
  console.log(`  Bookkeeper:     ${bookkeeper.email} / ${PASSWORD}`);
  console.log(`  Client portal:  ${nadia.email} / ${PASSWORD}`);
  console.log(`  Projects: ${[mainHouse, kitchen, lobby].length}, invoices from ${paidInvoice.number}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
