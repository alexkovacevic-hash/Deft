import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardList, CreditCard, Link2, ShieldCheck, Sofa, Users } from "lucide-react";
import { getPortalContext, getStudioContext } from "@/lib/tenant";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    icon: Users,
    title: "Clients and projects together",
    body: "Every client page lists their live and finished projects, with budgets, leads and dates.",
  },
  {
    icon: Sofa,
    title: "Selections your clients approve",
    body: "Present furniture and finishes room by room. Clients approve or decline in their portal.",
  },
  {
    icon: Link2,
    title: "Share the websites you source from",
    body: "Drop in a link and it arrives in the portal with a title, blurb and image.",
  },
  {
    icon: ClipboardList,
    title: "Time that becomes an invoice",
    body: "Log hours against a project and pull unbilled time straight onto a draft invoice.",
  },
  {
    icon: CreditCard,
    title: "Get paid in the portal",
    body: "Bill for hours and for items, then let clients pay by card. Check and ACH payments log too.",
  },
  {
    icon: ShieldCheck,
    title: "Roles you define",
    body: "Build your own roles from twenty permissions — a bookkeeper never has to see design work.",
  },
];

export default async function HomePage() {
  // Signed-in visitors go straight to the surface that belongs to them.
  const studio = await getStudioContext();
  if (studio) redirect("/studio");
  const portal = await getPortalContext();
  if (portal && portal.access.length > 0) redirect("/portal");

  return (
    <main className="min-h-screen bg-clay-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="display text-xl text-ink-900">Deft Designer</span>
        <div className="flex gap-2">
          <Link href="/signin">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start a studio</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:pt-20">
        <p className="text-xs uppercase tracking-[0.2em] text-clay-600">For interior design studios</p>
        <h1 className="display mt-4 max-w-3xl text-4xl leading-tight text-ink-900 sm:text-6xl">
          The studio side and the client side of every project, in one place.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-500">
          Track clients, run projects, present selections, log billable hours and take payment — while your
          clients follow along in a portal of their own.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup">
            <Button size="lg">
              Start your studio <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/signin">
            <Button size="lg" variant="outline">Sign in</Button>
          </Link>
        </div>
      </section>

      <section className="border-t border-clay-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-clay-100 text-clay-700">
                <Icon className="h-4 w-4" />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-ink-800">{title}</h2>
              <p className="mt-1 text-sm text-ink-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-ink-400">
        Deft Designer — multi-tenant studio management.
      </footer>
    </main>
  );
}
