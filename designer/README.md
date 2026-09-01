# Deft Designer

Multi-tenant studio management for interior designers: clients, projects, selections,
shared websites, time, invoicing and payments — plus a client portal where customers
follow their projects, approve selections and pay.

## What's in it

**Two surfaces, one app**

- `/studio` — the designer's workspace. Dashboard, clients, projects, time, invoices, settings.
- `/portal` — the client's view. Their projects (current and finished), the selections
  waiting on them, the websites their designer has shared, and their invoices.

**Multi-tenancy.** Every business record carries an `organizationId`. A user can belong to
several studios and switch between them; queries are filtered by the active studio in
`src/lib/tenant.ts`, so one studio can never read another's data.

**Configurable roles.** Roles are rows owned by each studio, holding a set of permission keys
from the catalogue in `src/lib/permissions.ts`. New studios get five roles (Owner, Studio
Manager, Designer, Junior Designer, Bookkeeper) which they can rename, re-cut, delete or add
to. The owner role always keeps every permission — it's the way back in if another role is
mis-configured.

Notable permissions:

| Key | Effect |
| --- | --- |
| `projects.view` vs `projects.view_assigned` | whole studio, or only the projects they lead |
| `selections.view_cost` | whether item cost and margin are visible at all |
| `time.view_all` / `time.manage_all` | see and edit other people's hours |
| `clients.portal` | grant and revoke client portal logins |

**Clients and projects.** A client page lists their current projects (lead, proposal, active,
on hold) and their finished ones (completed, archived) with budgets, leads and dates,
alongside their portal logins, shared links and invoices.

**Selections.** Items are grouped by room, priced with an internal cost and a client-facing
price, and moved through draft → proposed → approved/rejected → ordered → delivered →
installed. Drafts stay with the studio; proposing sends them to the portal, where the client
approves or declines with a note.

**Shared websites.** Paste a URL and the app reads its Open Graph title, blurb and image
(`/api/resources/preview`), then shows the card in the client's portal. Links attach to a
project or to a client (in which case they appear on all of that client's projects).

**Time and invoicing.** Hours are logged against a project at a snapshotted rate (override →
project → member → studio default). A draft invoice pulls in unbilled billable time and
approved items in one step, so billing covers both hours and specific items. Clients pay by
card through Stripe Checkout; cheque, ACH and wire payments are recorded by hand. Totals and
status are recomputed from line items and payments after every edit.

## Running it

```bash
cp .env.example .env      # fill in DATABASE_URL and NEXTAUTH_SECRET
npm install
npx prisma migrate deploy # create the tables
npm run db:seed           # optional demo studio
npm run dev
```

`npm run db:seed` creates the Atelier Nord demo studio. Every account uses the password
`designdemo123`:

| Email | Sees |
| --- | --- |
| `maren@ateliernord.test` | Owner — everything |
| `dev@ateliernord.test` | Designer — projects, selections, time |
| `sana@ateliernord.test` | Junior Designer — only the projects they lead |
| `books@ateliernord.test` | Bookkeeper — invoices and payments, no design work |
| `nadia@ellsworth.test` | Client portal for The Ellsworth Residence |
| `theo@brightwater.test` | Client portal for Brightwater Hospitality |

## Deploying

Set `DATABASE_URL`, `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in the host's environment, then
deploy. `npm run build` runs `prisma migrate deploy` before `next build`, so the schema is
applied as part of every deploy — the first one creates all 18 tables.

Two things to get right:

- **Use a direct database URL, not a pooled one.** If your host gives you both (Neon,
  Supabase), `DATABASE_URL` must be the direct connection string. Migrations take a
  Postgres advisory lock, which a transaction-mode pooler (pgbouncer, Supabase port 6543)
  does not support, so `migrate deploy` will hang or fail against it.
- **`NEXTAUTH_SECRET` must be set in production.** Without it sessions cannot be signed.
  Generate one with `openssl rand -base64 32`.

If the app is up but every action returns an error, the message says which of these it is:
a missing schema, an unreachable database and a refused connection each report themselves
by name rather than as a generic failure.

If a deploy fails with `P3005: the database schema is not empty`, that database was set up
with `prisma db push` before migrations existed. Adopt it once:

```bash
npx prisma migrate resolve --applied 20260901202537_init
```

### Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | session signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | the app's public URL |
| `NEXT_PUBLIC_APP_URL` | used for Stripe success/cancel redirects |
| `STRIPE_SECRET_KEY` | enables portal card payments; without it checkout returns a clean 503 |
| `STRIPE_WEBHOOK_SECRET` | verifies `checkout.session.completed` at `/api/stripe/webhook` |

Point a Stripe webhook at `POST /api/stripe/webhook` for `checkout.session.completed`.
Payments are keyed on the payment intent, so Stripe's retries can't double-record.

## Layout

```
prisma/schema.prisma     tenancy, RBAC, projects, selections, billing
prisma/seed.ts           demo studio
src/lib/permissions.ts   the permission catalogue and default roles
src/lib/tenant.ts        active-studio resolution, permission checks, project scoping
src/lib/api.ts           route-handler guards and error shaping
src/lib/billing.ts       invoice totals, numbering, time/item → line item
src/app/studio/*         designer workspace
src/app/portal/*         client portal
src/app/api/*            REST handlers, each guarded by a permission
```

## Notes

- Passwords are bcrypt-hashed. Adding a teammate or a portal login creates the account and
  returns a one-time password, shown once for the designer to pass on.
- Deleting is deliberately hard where money is involved: clients and projects with invoices
  must be archived, invoices with payments must be voided, and removing a time line from an
  invoice returns those hours to the unbilled pool.
- The studio must always keep one active owner; the API refuses any change that would leave
  it without one.
