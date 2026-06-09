"use client";

import { useEffect, useState } from "react";
import type { AIFeature, PlanId } from "@/lib/billing/plans";

export interface ClientEntitlements {
  authed: boolean;
  plan: PlanId;
  features: AIFeature[];
  dailyLimit: number;
}

interface EntitlementsState {
  data: ClientEntitlements | null;
  loading: boolean;
}

// Module-level shared fetch so multiple gates trigger only one network request.
let sharedPromise: Promise<ClientEntitlements> | null = null;

function fetchEntitlements(): Promise<ClientEntitlements> {
  if (!sharedPromise) {
    sharedPromise = fetch("/api/me/entitlements", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => ({
        authed: Boolean(json?.authed),
        plan: (json?.plan as PlanId) ?? "free",
        features: (json?.features as AIFeature[]) ?? [],
        dailyLimit: Number(json?.dailyLimit ?? 0),
      }))
      .catch(() => ({
        authed: false,
        plan: "free" as PlanId,
        features: [] as AIFeature[],
        dailyLimit: 0,
      }));
  }
  return sharedPromise;
}

export function useEntitlements(): EntitlementsState & {
  hasFeature: (feature: AIFeature) => boolean;
} {
  const [state, setState] = useState<EntitlementsState>({
    data: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    fetchEntitlements().then((data) => {
      if (active) setState({ data, loading: false });
    });
    return () => {
      active = false;
    };
  }, []);

  return {
    ...state,
    hasFeature: (feature: AIFeature) =>
      state.data?.features.includes(feature) ?? false,
  };
}
