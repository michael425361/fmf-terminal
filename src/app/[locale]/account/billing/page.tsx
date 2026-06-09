import { setRequestLocale } from "next-intl/server";
import {
  ManageBillingButton,
  UpgradeButton,
} from "@/components/billing/BillingActions";
import { getAuthUserId } from "@/lib/auth/current-user";
import { getUserPlan } from "@/lib/saas/app-users";
import { getSubscription } from "@/lib/saas/subscriptions";
import { peekDailyQuota } from "@/lib/usage/quota";
import { getPlan, planDailyLimit } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  setRequestLocale(locale);

  const userId = await getAuthUserId();

  if (!userId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold text-neutral-100">Billing</h1>
        <p className="mt-4 text-neutral-400">
          Please sign in to view your subscription.
        </p>
      </main>
    );
  }

  const plan = await getUserPlan(userId);
  const planConfig = getPlan(plan);
  const subscription = await getSubscription(userId);
  const quota = await peekDailyQuota(userId, planDailyLimit(plan));

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold text-neutral-100">Billing</h1>

      {status === "success" && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          Payment successful — your Pro subscription is now active. If your plan
          still shows Free, refresh in a few seconds while we finalize it.
        </div>
      )}
      {status === "cancelled" && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-400"
        >
          Checkout was cancelled — you have not been charged.
        </div>
      )}

      <section className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Current plan</p>
            <p className="text-xl font-semibold text-neutral-100">
              {planConfig.name}
            </p>
          </div>
          {subscription?.cancel_at_period_end && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
              Cancels at period end
            </span>
          )}
        </div>

        <div className="mt-4 text-sm text-neutral-400">
          Daily usage:{" "}
          <span className="text-neutral-200">
            {quota.used} / {quota.limit}
          </span>{" "}
          AI requests
          {!quota.enforced && (
            <span className="ml-2 text-xs text-neutral-600">
              (metering inactive — Redis not configured)
            </span>
          )}
        </div>

        <div className="mt-6">
          {plan === "pro" ? (
            <ManageBillingButton locale={locale} />
          ) : (
            <UpgradeButton locale={locale} />
          )}
        </div>
      </section>
    </main>
  );
}
