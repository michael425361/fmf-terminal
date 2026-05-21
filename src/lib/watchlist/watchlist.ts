import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface WatchlistRow {
  id: string;
  user_id: string;
  symbol: string;
  created_at: string;
}

export async function getWatchlist(
  userId: string,
  client?: SupabaseClient
): Promise<string[]> {
  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from("watchlists")
    .select("symbol")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.symbol as string);
}

export async function addToWatchlist(
  symbol: string,
  userId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();
  const key = symbol.trim();
  if (!key) return;

  const { error } = await supabase
    .from("watchlists")
    .upsert(
      { user_id: userId, symbol: key },
      { onConflict: "user_id,symbol", ignoreDuplicates: true }
    );

  if (error) throw new Error(error.message);
}

export async function removeFromWatchlist(
  symbol: string,
  userId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();
  const { error } = await supabase
    .from("watchlists")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", symbol.trim());

  if (error) throw new Error(error.message);
}

export async function syncWatchlistSymbols(
  symbols: string[],
  userId: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createClient();
  const unique = [...new Set(symbols.map((s) => s.trim()).filter(Boolean))];

  const { data: existing, error: fetchErr } = await supabase
    .from("watchlists")
    .select("symbol")
    .eq("user_id", userId);

  if (fetchErr) throw new Error(fetchErr.message);

  const existingSet = new Set((existing ?? []).map((r) => r.symbol as string));
  const targetSet = new Set(unique);

  const toAdd = unique.filter((s) => !existingSet.has(s));
  const toRemove = [...existingSet].filter((s) => !targetSet.has(s));

  if (toAdd.length > 0) {
    const { error } = await supabase.from("watchlists").insert(
      toAdd.map((symbol) => ({ user_id: userId, symbol }))
    );
    if (error) throw new Error(error.message);
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("user_id", userId)
      .in("symbol", toRemove);
    if (error) throw new Error(error.message);
  }
}
