import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { getAuthUserId } from "@/lib/auth/current-user";
import { isAdmin } from "@/lib/saas/admin";
import { getAdminOverview } from "@/lib/saas/analytics";

export const dynamic = "force-dynamic";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const userId = await getAuthUserId();
  if (!(await isAdmin(userId))) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold text-neutral-100">Admin</h1>
        <p className="mt-4 text-neutral-400">
          You do not have access to this area.
        </p>
      </main>
    );
  }

  const m = await getAdminOverview();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-100">Admin dashboard</h1>
        <Link
          href={`/${locale}/admin/cost`}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          Cost analytics →
        </Link>
      </div>

      {!m.configured && (
        <p className="mt-4 rounded-lg border border-amber-700/40 bg-amber-500/5 p-3 text-sm text-amber-400">
          Supabase service role is not configured — metrics are empty.
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase text-neutral-500">
          Users
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total users" value={m.totalUsers.toLocaleString()} />
          <StatCard
            label="New (7d / 30d)"
            value={`${m.newUsers7d} / ${m.newUsers30d}`}
          />
          <StatCard
            label="Active (24h / 7d)"
            value={`${m.activeUsers24h} / ${m.activeUsers7d}`}
          />
          <StatCard
            label="Conversion"
            value={pct(m.conversionRate)}
            sub={`${m.proUsers} Pro subscribers`}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase text-neutral-500">
          AI usage (30d)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="AI requests"
            value={m.totalRequests30d.toLocaleString()}
          />
          <StatCard
            label="Tokens"
            value={m.totalTokens30d.toLocaleString()}
          />
          <StatCard
            label="Est. OpenAI cost"
            value={`$${m.estimatedCost30d.toFixed(2)}`}
          />
          <StatCard label="Cache hit rate" value={pct(m.cacheHitRate30d)} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase text-neutral-500">
          Revenue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Est. MRR"
            value={`$${m.estimatedMonthlyRevenue.toFixed(2)}`}
          />
          <StatCard
            label="Gross margin (30d)"
            value={
              m.estimatedMonthlyRevenue > 0
                ? pct(
                    Math.max(
                      0,
                      (m.estimatedMonthlyRevenue - m.estimatedCost30d) /
                        m.estimatedMonthlyRevenue
                    )
                  )
                : "—"
            }
            sub="Revenue vs AI cost"
          />
        </div>
      </section>
    </main>
  );
}
