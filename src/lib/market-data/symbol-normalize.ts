import { getCatalogEntryById, getCatalogEntryBySymbol } from "@/lib/watchlist/catalog-registry";

export type DetectedMarket = "us" | "cn" | "hk" | "tw" | "unknown";

/** Pad HK equity code to 4 digits; never strip leading zeros. */
export function padHKCode(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (!digits) return code;
  return digits.padStart(4, "0");
}

/** Detect market from Yahoo-style symbol suffix and fallback rules. */
export function detectMarketFromSymbol(symbol: string): DetectedMarket {
  const upper = symbol.trim().toUpperCase();
  if (!upper) return "unknown";

  if (upper.endsWith(".HK")) return "hk";
  if (upper.endsWith(".TW")) return "tw";
  if (
    upper.endsWith(".SS") ||
    upper.endsWith(".SZ") ||
    upper.endsWith(".SH")
  ) {
    return "cn";
  }
  if (upper.endsWith(".US")) return "us";

  const base = upper.includes(".") ? upper.split(".")[0] : upper;

  if (!upper.includes(".")) {
    if (/^\d{6}$/.test(base)) return "cn";
    if (/^\d{1,5}$/.test(base)) return "unknown";
    if (/^[A-Z][A-Z0-9.-]*$/.test(base)) return "us";
  }

  return "unknown";
}

function resolveNumericCatalogSymbol(digits: string): string | null {
  const code = digits.replace(/\D/g, "");
  if (!code) return null;

  const hkEntry = getCatalogEntryById(`hk-${padHKCode(code)}`);
  if (hkEntry?.symbol) return formatProviderSymbol(hkEntry.symbol);

  const twEntry = getCatalogEntryById(`tw-${code}`);
  if (twEntry?.symbol) return formatProviderSymbol(twEntry.symbol);

  return null;
}

function normalizeChinaNumeric(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (!digits) return code;
  const padded = digits.padStart(6, "0");
  const suffix = padded.startsWith("6") || padded.startsWith("5") ? "SS" : "SZ";
  return `${padded}.${suffix}`;
}

function formatProviderSymbol(raw: string): string {
  const idMatch = raw.match(/^(hk|tw)-(\d+)$/i);
  if (idMatch) {
    const market = idMatch[1].toUpperCase();
    const code =
      market === "HK" ? padHKCode(idMatch[2]) : idMatch[2].replace(/\D/g, "");
    return `${code}.${market}`;
  }

  const upper = raw.toUpperCase();

  if (upper.endsWith(".HK")) {
    const code = raw.slice(0, raw.length - 3);
    return `${padHKCode(code)}.HK`;
  }

  if (upper.endsWith(".TW")) {
    const code = raw.slice(0, raw.length - 3).replace(/\D/g, "");
    return code ? `${code}.TW` : upper;
  }

  if (
    upper.endsWith(".SS") ||
    upper.endsWith(".SZ") ||
    upper.endsWith(".SH")
  ) {
    return upper.replace(/\.SH$/, ".SS");
  }

  if (/^\d+$/.test(upper)) {
    const catalogSym = resolveNumericCatalogSymbol(upper);
    if (catalogSym) return catalogSym;

    if (upper.length >= 6) return normalizeChinaNumeric(upper);
    if (/^\d{4}$/.test(upper)) {
      const hkSym = `${padHKCode(upper)}.HK`;
      const twSym = `${upper}.TW`;
      if (getCatalogEntryBySymbol(hkSym)) return hkSym;
      if (getCatalogEntryBySymbol(twSym)) return twSym;
      if (upper.startsWith("0")) return hkSym;
      return twSym;
    }
  }

  const market = detectMarketFromSymbol(raw);

  if (market === "hk" && /^\d+$/.test(upper)) {
    return `${padHKCode(upper)}.HK`;
  }

  if (market === "tw" && /^\d+$/.test(upper)) {
    return `${upper.replace(/\D/g, "")}.TW`;
  }

  if (market === "cn" && /^\d+$/.test(upper)) {
    return normalizeChinaNumeric(upper);
  }

  return upper.includes(".") ? upper : raw.toUpperCase();
}

/**
 * Normalize any watchlist id, catalog symbol, or raw ticker to Yahoo provider format.
 * HK: preserve leading zeros (0700.HK). TW: 2330.TW.
 */
export function normalizeYahooSymbol(input: string): string {
  const raw = input.trim();
  if (!raw) return raw;

  const catalog =
    getCatalogEntryById(raw) ??
    getCatalogEntryBySymbol(raw) ??
    getCatalogEntryBySymbol(raw.toUpperCase());
  if (catalog?.symbol) {
    return formatProviderSymbol(catalog.symbol);
  }

  return formatProviderSymbol(raw);
}

/** Resolve provider symbol from id or ticker (alias for chart/quote APIs). */
export function resolveProviderSymbol(symbolOrId: string): string {
  return normalizeYahooSymbol(symbolOrId);
}
