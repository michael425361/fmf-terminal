import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/billing/plans";

export interface AdminOverview {
  configured: boolean;
  totalUsers: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsers24h: number;
  activeUsers7d: number;
  proUsers: number;
  conversionRate: number; // 0..1
  totalRequests30d: number;
  totalTokens30d: number;
  estimatedCost30d: number;
  cacheHitRate30d: number; // 0..1
  estimatedMonthlyRevenue: number;
}

export interface CostBreakdownRow {
  key: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface DailyCostPoint {
  day: string;
  requests: number;
  cost: number;
}

export interface CostAnalytics {
  configured: boolean;
  totalCost: number;
  cacheHitRate: number;
  costPerUser: number;
  byModel: CostBreakdownRow[];
  byFeature: CostBreakdownRow[];
  daily: DailyCostPoint[];
}

interface UsageDailyCostRow {
  day: string;
  feature: string | null;
  model: string | null;
  request_count: number;
  cached_count: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function dayStampAgo(days: number): string {
  return daysAgoIso(days).slice(0, 10);
}

const EMPTY_OVERVIEW: AdminOverview = {
  configured: false,
  totalUsers: 0,
  newUsers7d: 0,
  newUsers30d: 0,
  activeUsers24h: 0,
  activeUsers7d: 0,
  proUsers: 0,
  conversionRate: 0,
  totalRequests30d: 0,
  totalTokens30d: 0,
  estimatedCost30d: 0,
  cacheHitRate30d: 0,
  estimatedMonthlyRevenue: 0,
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = createAdminClient();
  if (!db) return EMPTY_OVERVIEW;

  const head = () =>
    db.from("app_users").select("*", { count: "exact", head: true });

  const [
    totalUsersRes,
    newUsers7dRes,
    newUsers30dRes,
    activeUsers24hRes,
    activeUsers7dRes,
    proUsersRes,
  ] = await Promise.all([
    head(),
    head().gte("created_at", daysAgoIso(7)),
    head().gte("created_at", daysAgoIso(30)),
    head().gte("last_active_at", daysAgoIso(1)),
    head().gte("last_active_at", daysAgoIso(7)),
    head().eq("plan", "pro"),
  ]);

  const totalUsers = totalUsersRes.count ?? 0;
  const newUsers7d = newUsers7dRes.count ?? 0;
  const newUsers30d = newUsers30dRes.count ?? 0;
  const activeUsers24h = activeUsers24hRes.count ?? 0;
  const activeUsers7d = activeUsers7dRes.count ?? 0;
  const proUsers = proUsersRes.count ?? 0;

  const { data: costRows } = await db
    .from("usage_daily_costs")
    .select("*")
    .gte("day", dayStampAgo(30));

  const rows = (costRows ?? []) as UsageDailyCostRow[];
  const totalRequests30d = rows.reduce((s, r) => s + (r.request_count ?? 0), 0);
  const cached = rows.reduce((s, r) => s + (r.cached_count ?? 0), 0);
  const totalTokens30d = rows.reduce((s, r) => s + (r.total_tokens ?? 0), 0);
  const estimatedCost30d = rows.reduce(
    (s, r) => s + Number(r.estimated_cost_usd ?? 0),
    0
  );

  return {
    configured: true,
    totalUsers,
    newUsers7d,
    newUsers30d,
    activeUsers24h,
    activeUsers7d,
    proUsers,
    conversionRate: totalUsers > 0 ? proUsers / totalUsers : 0,
    totalRequests30d,
    totalTokens30d,
    estimatedCost30d: round2(estimatedCost30d),
    cacheHitRate30d: totalRequests30d > 0 ? cached / totalRequests30d : 0,
    estimatedMonthlyRevenue: proUsers * PLANS.pro.monthlyPriceUsd,
  };
}

export async function getCostAnalytics(days = 30): Promise<CostAnalytics> {
  const db = createAdminClient();
  if (!db) {
    return {
      configured: false,
      totalCost: 0,
      cacheHitRate: 0,
      costPerUser: 0,
      byModel: [],
      byFeature: [],
      daily: [],
    };
  }

  const { data: costRows } = await db
    .from("usage_daily_costs")
    .select("*")
    .gte("day", dayStampAgo(days));
  const rows = (costRows ?? []) as UsageDailyCostRow[];

  const byModel = aggregate(rows, (r) => r.model ?? "unknown");
  const byFeature = aggregate(rows, (r) => r.feature ?? "unknown");

  const dailyMap = new Map<string, DailyCostPoint>();
  for (const r of rows) {
    const point = dailyMap.get(r.day) ?? { day: r.day, requests: 0, cost: 0 };
    point.requests += r.request_count ?? 0;
    point.cost += Number(r.estimated_cost_usd ?? 0);
    dailyMap.set(r.day, point);
  }
  const daily = Array.from(dailyMap.values())
    .map((p) => ({ ...p, cost: round2(p.cost) }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const totalCost = rows.reduce(
    (s, r) => s + Number(r.estimated_cost_usd ?? 0),
    0
  );
  const totalRequests = rows.reduce((s, r) => s + (r.request_count ?? 0), 0);
  const cached = rows.reduce((s, r) => s + (r.cached_count ?? 0), 0);

  const { count: activeUserCount } = await db
    .from("app_users")
    .select("*", { count: "exact", head: true })
    .gte("last_active_at", daysAgoIso(days));
  const users = activeUserCount ?? 0;

  return {
    configured: true,
    totalCost: round2(totalCost),
    cacheHitRate: totalRequests > 0 ? cached / totalRequests : 0,
    costPerUser: users > 0 ? round2(totalCost / users) : 0,
    byModel,
    byFeature,
    daily,
  };
}

function aggregate(
  rows: UsageDailyCostRow[],
  keyFn: (r: UsageDailyCostRow) => string
): CostBreakdownRow[] {
  const map = new Map<string, CostBreakdownRow>();
  for (const r of rows) {
    const key = keyFn(r);
    const entry = map.get(key) ?? { key, requests: 0, tokens: 0, cost: 0 };
    entry.requests += r.request_count ?? 0;
    entry.tokens += r.total_tokens ?? 0;
    entry.cost += Number(r.estimated_cost_usd ?? 0);
    map.set(key, entry);
  }
  return Array.from(map.values())
    .map((e) => ({ ...e, cost: round2(e.cost) }))
    .sort((a, b) => b.cost - a.cost);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
