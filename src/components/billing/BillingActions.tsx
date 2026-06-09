"use client";

import { useState } from "react";

async function postBilling(
  endpoint: string,
  locale: string
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale }),
  });
  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; url?: string; error?: string }
    | null;
  if (data?.url) {
    window.location.href = data.url;
    return;
  }
  throw new Error(data?.error ?? "request_failed");
}

export function UpgradeButton({
  locale,
  label = "Upgrade to Pro",
  className,
}: {
  locale: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setError(null);
          setLoading(true);
          try {
            await postBilling("/api/billing/checkout", locale);
          } catch {
            setError("Could not start checkout. Please try again.");
            setLoading(false);
          }
        }}
        className={
          className ??
          "inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
        }
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export function ManageBillingButton({
  locale,
  label = "Manage billing",
  className,
}: {
  locale: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setError(null);
          setLoading(true);
          try {
            await postBilling("/api/billing/portal", locale);
          } catch {
            setError("Could not open billing portal. Please try again.");
            setLoading(false);
          }
        }}
        className={
          className ??
          "inline-flex items-center justify-center rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-800 disabled:opacity-60"
        }
      >
        {loading ? "Opening…" : label}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
