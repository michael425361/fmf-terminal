/**
 * Exchange session detection from wall-clock time (IANA timezones).
 * Used for compact market-status labels on the ticker strip.
 */

export type ExchangeRegion = "us" | "hk" | "tw" | "cn" | "crypto";

export type SessionPhase =
  | "regular"
  | "pre"
  | "post"
  | "closed"
  | "lunch";

export interface ExchangeSessionStatus {
  region: ExchangeRegion;
  phase: SessionPhase;
  /** i18n key under marketStatus.* */
  labelKey: string;
  isLive: boolean;
}

const TZ = {
  us: "America/New_York",
  hk: "Asia/Hong_Kong",
  tw: "Asia/Taipei",
  cn: "Asia/Shanghai",
} as const;

interface LocalClock {
  weekday: number;
  hour: number;
  minute: number;
}

function getLocalClock(now: Date, timeZone: string): LocalClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    weekday: weekdayMap[weekdayStr] ?? 1,
    hour,
    minute,
  };
}

function minutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function isWeekend(clock: LocalClock): boolean {
  return clock.weekday === 0 || clock.weekday === 6;
}

function resolveUSPhase(clock: LocalClock): SessionPhase {
  if (isWeekend(clock)) return "closed";
  const m = minutesSinceMidnight(clock.hour, clock.minute);
  if (m >= 9 * 60 + 30 && m < 16 * 60) return "regular";
  if (m >= 4 * 60 && m < 9 * 60 + 30) return "pre";
  if (m >= 16 * 60 && m < 20 * 60) return "post";
  return "closed";
}

function resolveHKPhase(clock: LocalClock): SessionPhase {
  if (isWeekend(clock)) return "closed";
  const m = minutesSinceMidnight(clock.hour, clock.minute);
  if (m >= 9 * 60 + 30 && m < 12 * 60) return "regular";
  if (m >= 12 * 60 && m < 13 * 60) return "lunch";
  if (m >= 13 * 60 && m <= 16 * 60) return "regular";
  return "closed";
}

function resolveTWPhase(clock: LocalClock): SessionPhase {
  if (isWeekend(clock)) return "closed";
  const m = minutesSinceMidnight(clock.hour, clock.minute);
  if (m >= 9 * 60 && m < 13 * 60 + 30) return "regular";
  if (m >= 13 * 60 + 30 && m < 14 * 60) return "lunch";
  if (m >= 14 * 60 && m <= 15 * 60 + 30) return "regular";
  return "closed";
}

function resolveCNPhase(clock: LocalClock): SessionPhase {
  if (isWeekend(clock)) return "closed";
  const m = minutesSinceMidnight(clock.hour, clock.minute);
  if (m >= 9 * 60 + 30 && m < 11 * 60 + 30) return "regular";
  if (m >= 11 * 60 + 30 && m < 13 * 60) return "lunch";
  if (m >= 13 * 60 && m <= 15 * 60) return "regular";
  return "closed";
}

function phaseToLabelKey(region: ExchangeRegion, phase: SessionPhase): string {
  if (phase === "lunch") return `${region}Lunch`;
  if (phase === "pre") return `${region}Pre`;
  if (phase === "post") return `${region}Post`;
  if (phase === "regular") return `${region}Open`;
  return `${region}Closed`;
}

function resolvePhase(
  region: ExchangeRegion,
  now = new Date()
): ExchangeSessionStatus {
  if (region === "crypto") {
    return {
      region,
      phase: "regular",
      labelKey: "crypto24h",
      isLive: true,
    };
  }

  const tz = TZ[region];
  const clock = getLocalClock(now, tz);
  let phase: SessionPhase;

  switch (region) {
    case "us":
      phase = resolveUSPhase(clock);
      break;
    case "hk":
      phase = resolveHKPhase(clock);
      break;
    case "tw":
      phase = resolveTWPhase(clock);
      break;
    case "cn":
      phase = resolveCNPhase(clock);
      break;
    default:
      phase = "closed";
  }

  return {
    region,
    phase,
    labelKey: phaseToLabelKey(region, phase),
    isLive: phase === "regular",
  };
}

/** Primary equity regions shown on the ticker status strip. */
export const TICKER_STATUS_REGIONS: ExchangeRegion[] = [
  "us",
  "hk",
  "tw",
  "cn",
];

export function getExchangeSessionStatuses(
  now = new Date()
): ExchangeSessionStatus[] {
  return TICKER_STATUS_REGIONS.map((region) => resolvePhase(region, now));
}

export function getRegionShortCode(region: ExchangeRegion): string {
  const map: Record<ExchangeRegion, string> = {
    us: "US",
    hk: "HK",
    tw: "TW",
    cn: "CN",
    crypto: "CRYPTO",
  };
  return map[region];
}
