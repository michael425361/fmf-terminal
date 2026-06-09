import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { getAuthUserId } from "@/lib/auth/current-user";
import { isAdmin } from "@/lib/saas/admin";
import { getCostAnalytics, type CostBreakdownRow } from "@/lib/saas/analytics";

export const dynamic = "force-dynamic";

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: CostBreakdownRow[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.cost));
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key} className="text-sm">
              <div className="flex items-center justify-between text-neutral-300">
                <span className="font-mono">{r.key}</span>
                <span>${r.cost.toFixed(2)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-neutral-800">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(r.cost / max) * 100}%` }}
                />
              </div>
              <div className="mt-0.5 text-xs text-neutral-500">
                {r.requests.toLocaleString()} requests ·{" "}
                {r.tokens.toLocaleString()} tokens
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function CostAnalyticsPage({
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
        <h1 className="text-2xl font-bold text-neutral-100">Cost analytics</h1>
        <p className="mt-4 text-neutral-400">
          You do not have access to this area.
        </p>
      </main>
    );
  }

  const c = await getCostAnalytics(30);
  const maxDaily = Math.max(1, ...c.daily.map((d) => d.cost));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-100">
          Cost analytics (30d)
        </h1>
        <Link
          href={`/${locale}/admin`}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800"
        >
          ← Overview
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <p className="text-xs uppercase text-neutral-500">Total cost</p>
          <p className="mt-2 text-2xl font-bold text-neutral-100">
            ${c.totalCost.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <p className="text-xs uppercase text-neutral-500">Cost / active user</p>
          <p className="mt-2 text-2xl font-bold text-neutral-100">
            ${c.costPerUser.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <p className="text-xs uppercase text-neutral-500">Cache hit rate</p>
          <p className="mt-2 text-2xl font-bold text-neutral-100">
            {(c.cacheHitRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <BreakdownTable title="Spend by model" rows={c.byModel} />
        <BreakdownTable title="Spend by feature" rows={c.byFeature} />
      </div>

      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
        <h3 className="mb-3 text-sm font-semibold text-neutral-200">
          Daily spend
        </h3>
        {c.daily.length === 0 ? (
          <p className="text-sm text-neutral-500">No data yet.</p>
        ) : (
          <div className="flex h-40 items-end gap-1">
            {c.daily.map((d) => (
              <div
                key={d.day}
                className="flex-1 rounded-t bg-emerald-500/70"
                style={{ height: `${(d.cost / maxDaily) * 100}%` }}
                title={`${d.day}: $${d.cost.toFixed(2)} (${d.requests} req)`}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
