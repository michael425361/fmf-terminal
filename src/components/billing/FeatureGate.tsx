"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AIFeature } from "@/lib/billing/plans";
import { useEntitlements } from "./useEntitlements";

/**
 * Reusable client-side feature gate.
 *
 * Renders `children` when the current plan is entitled to `feature`, otherwise
 * renders `fallback` (defaults to an upgrade prompt). While entitlements load it
 * optimistically renders children to avoid layout flashes; the server-side
 * `guardAIRequest` is the authoritative enforcement point.
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  locale = "en",
}: {
  feature: AIFeature;
  children: ReactNode;
  fallback?: ReactNode;
  locale?: string;
}) {
  const { data, loading, hasFeature } = useEntitlements();

  if (loading || !data) return <>{children}</>;
  if (hasFeature(feature)) return <>{children}</>;

  return <>{fallback ?? <UpgradePrompt locale={locale} feature={feature} />}</>;
}

export function UpgradePrompt({
  locale = "en",
  feature,
}: {
  locale?: string;
  feature?: AIFeature;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">
        <Lock className="h-4 w-4 text-emerald-500" />
        Pro feature
      </div>
      <p className="text-sm text-neutral-400">
        {feature === "research-report"
          ? "AI Research Reports are available on the Pro plan."
          : feature === "earnings-analysis"
            ? "Earnings Analysis is available on the Pro plan."
            : "This feature is available on the Pro plan."}
      </p>
      <Link
        href={`/${locale}/pricing`}
        className="mt-1 inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
