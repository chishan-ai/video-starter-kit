import { requireUser } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";
import { DashboardContent } from "./dashboard-content";
import { CreditsBadge } from "@/components/billing/credits-badge";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">Mozoria</h1>
          <div className="flex items-center gap-4">
            <CreditsBadge />
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <DashboardContent />
      </main>
    </div>
  );
}
