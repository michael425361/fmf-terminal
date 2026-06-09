import { Check } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { UpgradeButton } from "@/components/billing/BillingActions";
import { PLANS } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

const FEATURE_LABELS: Record<string, string> = {
  "market-summary": "AI Market Summary",
  "news-summary": "News Intelligence",
  "explain-move": "Explain Move",
  "research-report": "AI Research Reports",
  "earnings-analysis": "Earnings Analysis",
};

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const free = PLANS.free;
  const pro = PLANS.pro;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-neutral-100">
          Choose your plan
        </h1>
        <p className="mt-2 text-neutral-400">
          The AI research terminal for retail investors.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="text-xl font-semibold text-neutral-100">{free.name}</h2>
          <p className="mt-1 text-3xl font-bold text-neutral-100">
            $0
            <span className="text-base font-normal text-neutral-500">/mo</span>
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            {free.dailyRequestLimit} AI requests per day
          </p>
          <ul className="mt-6 space-y-2 text-sm text-neutral-300">
            {free.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                {FEATURE_LABELS[f] ?? f}
              </li>
            ))}
          </ul>
        </section>

        {/* Pro */}
        <section className="rounded-xl border border-emerald-600/40 bg-neutral-950 p-6 ring-1 ring-emerald-600/20">
          <h2 className="text-xl font-semibold text-neutral-100">{pro.name}</h2>
          <p className="mt-1 text-3xl font-bold text-neutral-100">
            ${pro.monthlyPriceUsd}
            <span className="text-base font-normal text-neutral-500">/mo</span>
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            {pro.dailyRequestLimit} AI requests per day
          </p>
          <ul className="mt-6 space-y-2 text-sm text-neutral-300">
            {pro.features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                {FEATURE_LABELS[f] ?? f}
              </li>
            ))}
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              Portfolio Intelligence (coming soon)
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              Watchlist Agent (coming soon)
            </li>
          </ul>
          <div className="mt-6">
            <UpgradeButton locale={locale} />
          </div>
        </section>
      </div>
    </main>
  );
}
