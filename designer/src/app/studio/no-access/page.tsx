import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { requireStudio } from "@/lib/tenant";

export default async function NoAccessPage() {
  const ctx = await requireStudio();
  return (
    <EmptyState
      title="Your role doesn't include that"
      description={`You're signed in as ${ctx.roleName} at ${ctx.organization.name}. Ask an owner to adjust your role if you need access.`}
      action={
        <Link href="/studio">
          <Button variant="outline" size="sm">Back to dashboard</Button>
        </Link>
      }
    />
  );
}
