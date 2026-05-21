import type { ChartTimeframe, OHLCVBar } from "./types";
import {
  type RejectedCandle,
  type RejectReason,
  isOhlcConsistent,
  isValidPrice,
  isValidTimestamp,
  isValidVolume,
  median,
  neighborCloses,
  normalizeRawBar,
  reconcileOhlc,
} from "./candle-validation";

export interface SanitizeCandleOptions {
  symbol?: string;
  timeframe?: ChartTimeframe;
  /** Emit console.warn for each rejected bar (default: true). */
  logWarnings?: boolean;
  /** Max body move vs previous close before flagging (default 0.45). */
  maxBodyMoveFromPrev?: number;
  /** High wick size vs rolling median close (default 0.22). */
  maxHighVsMedian?: number;
  /** Low wick depth vs rolling median close (default 0.22). */
  maxLowVsMedian?: number;
  /** Wick-only corruption: wick % of ref with small body move (default 0.18). */
  wickExcessThreshold?: number;
  /** Body move below this with large wick => wick anomaly (default 0.07). */
  wickBodyMoveMax?: number;
  /** Keep zero-volume intraday bars (HK/TW sessions). */
  allowZeroVolumeIntraday?: boolean;
  /** Skip wick/spike rejection (HK/TW real ticks). */
  skipSpikeFilter?: boolean;
  /** Skip thin-volume range outlier filter. */
  skipThinVolumeAnomaly?: boolean;
}

export interface SanitizeCandleResult {
  bars: OHLCVBar[];
  rejected: RejectedCandle[];
}

const INTRADAY_TIMEFRAMES = new Set<ChartTimeframe>(["1D", "5D"]);

function warnRejected(
  options: SanitizeCandleOptions,
  rejected: RejectedCandle
): void {
  if (options.logWarnings === false) return;
  const prefix = options.symbol
    ? `[candles:${options.symbol}${options.timeframe ? `/${options.timeframe}` : ""}]`
    : "[candles]";
  console.warn(`${prefix} Rejected bar: ${rejected.message}`, {
    reason: rejected.reason,
    time: rejected.time,
    bar: rejected.bar,
  });
}

function pushReject(
  rejected: RejectedCandle[],
  options: SanitizeCandleOptions,
  entry: RejectedCandle
): void {
  rejected.push(entry);
  warnRejected(options, entry);
}

function detectWickSpike(
  bar: OHLCVBar,
  prevClose: number | null,
  medianClose: number,
  opts: Required<
    Pick<
      SanitizeCandleOptions,
      | "maxBodyMoveFromPrev"
      | "maxHighVsMedian"
      | "maxLowVsMedian"
      | "wickExcessThreshold"
      | "wickBodyMoveMax"
    >
  >
): RejectReason | null {
  const bodyTop = Math.max(bar.open, bar.close);
  const bodyBottom = Math.min(bar.open, bar.close);
  const bodyMid = (bar.open + bar.close) / 2;

  const ref =
    prevClose && prevClose > 0
      ? prevClose
      : medianClose > 0
        ? medianClose
        : bodyMid;

  if (ref <= 0) return null;

  const bodyMove = Math.abs(bodyMid - ref) / ref;
  const highExcess = (bar.high - bodyTop) / ref;
  const lowExcess = (bodyBottom - bar.low) / ref;

  // Classic broken Yahoo tick: huge wick, flat body near prior close.
  if (
    highExcess >= opts.wickExcessThreshold &&
    bodyMove <= opts.wickBodyMoveMax
  ) {
    return "wick-anomaly";
  }
  if (
    lowExcess >= opts.wickExcessThreshold &&
    bodyMove <= opts.wickBodyMoveMax
  ) {
    return "wick-anomaly";
  }

  if (medianClose > 0) {
    if (
      bar.high > medianClose * (1 + opts.maxHighVsMedian) &&
      highExcess > opts.wickExcessThreshold * 0.5
    ) {
      return "spike-high";
    }
    if (
      bar.low < medianClose * (1 - opts.maxLowVsMedian) &&
      lowExcess > opts.wickExcessThreshold * 0.5
    ) {
      return "spike-low";
    }
  }

  if (prevClose && prevClose > 0 && bodyMove > opts.maxBodyMoveFromPrev) {
    return "extreme-move";
  }

  return null;
}

function isThinVolumeAnomaly(
  bar: OHLCVBar,
  medianVol: number,
  medianRange: number
): boolean {
  if (medianVol <= 0 || medianRange <= 0) return false;
  const range = bar.high - bar.low;
  const volRatio = bar.volume / medianVol;
  const rangeRatio = range / medianRange;
  return volRatio < 0.015 && rangeRatio > 3.5;
}

function isIncompleteBar(
  bar: OHLCVBar,
  timeframe?: ChartTimeframe,
  allowZeroVolumeIntraday?: boolean
): boolean {
  if (!isValidVolume(bar.volume)) return true;
  // Zero-volume intraday prints are often partial / bad Yahoo rows.
  if (
    !allowZeroVolumeIntraday &&
    timeframe &&
    INTRADAY_TIMEFRAMES.has(timeframe) &&
    bar.volume === 0
  ) {
    return true;
  }
  return false;
}

/**
 * Full candle sanitization pipeline: validate, sort, dedupe, spike-filter, return clean bars.
 */
export function sanitizeCandleBars(
  input: unknown[],
  options: SanitizeCandleOptions = {}
): SanitizeCandleResult {
  const rejected: RejectedCandle[] = [];
  const spikeOpts = {
    maxBodyMoveFromPrev: options.maxBodyMoveFromPrev ?? 0.45,
    maxHighVsMedian: options.maxHighVsMedian ?? 0.22,
    maxLowVsMedian: options.maxLowVsMedian ?? 0.22,
    wickExcessThreshold: options.wickExcessThreshold ?? 0.18,
    wickBodyMoveMax: options.wickBodyMoveMax ?? 0.07,
  };

  const parsed: OHLCVBar[] = [];

  for (const raw of input) {
    const bar = normalizeRawBar(raw);
    if (!bar) {
      const partial =
        raw && typeof raw === "object"
          ? (raw as Partial<OHLCVBar>)
          : { time: undefined };
      pushReject(rejected, options, {
        reason: "invalid-field",
        message: "Missing or non-finite OHLCV fields",
        bar: partial,
        time: partial.time,
      });
      continue;
    }

    if (!isValidTimestamp(bar.time)) {
      pushReject(rejected, options, {
        reason: "invalid-time",
        message: `Invalid timestamp: ${bar.time}`,
        bar,
        time: bar.time,
      });
      continue;
    }

    if (isIncompleteBar(bar, options.timeframe, options.allowZeroVolumeIntraday)) {
      pushReject(rejected, options, {
        reason: "incomplete",
        message: "Incomplete or zero-volume intraday candle",
        bar,
        time: bar.time,
      });
      continue;
    }

    if (!isOhlcConsistent(bar)) {
      const reconciled = reconcileOhlc(bar);
      if (!reconciled) {
        pushReject(rejected, options, {
          reason: "ohlc-inconsistent",
          message: `OHLC envelope invalid (H=${bar.high} L=${bar.low} O=${bar.open} C=${bar.close})`,
          bar,
          time: bar.time,
        });
        continue;
      }
      parsed.push(reconciled);
      continue;
    }

    parsed.push(bar);
  }

  parsed.sort((a, b) => a.time - b.time);

  const deduped: OHLCVBar[] = [];
  for (const bar of parsed) {
    const last = deduped[deduped.length - 1];
    if (last && last.time === bar.time) {
      const keep = bar.volume >= last.volume ? bar : last;
      const drop = keep === bar ? last : bar;
      pushReject(rejected, options, {
        reason: "duplicate-time",
        message: `Duplicate timestamp ${bar.time}; kept bar with volume ${keep.volume}`,
        bar: drop,
        time: bar.time,
      });
      if (deduped.length > 0) deduped[deduped.length - 1] = keep;
      continue;
    }
    deduped.push(bar);
  }

  const volumes = deduped.map((b) => b.volume);
  const ranges = deduped.map((b) => b.high - b.low);
  const medianVol = median(volumes);
  const medianRange = median(ranges);

  const filtered: OHLCVBar[] = [];

  for (let i = 0; i < deduped.length; i++) {
    const bar = deduped[i];
    const prevClose = i > 0 ? deduped[i - 1].close : null;
    const medClose = median(neighborCloses(deduped, i));

    if (!options.skipSpikeFilter) {
      const spike = detectWickSpike(
        bar,
        prevClose,
        Number.isFinite(medClose) ? medClose : bar.close,
        spikeOpts
      );
      if (spike) {
        pushReject(rejected, options, {
          reason: spike,
          message: `Anomalous wick or spike at time ${bar.time}`,
          bar,
          time: bar.time,
        });
        continue;
      }
    }

    if (
      !options.skipThinVolumeAnomaly &&
      options.timeframe &&
      INTRADAY_TIMEFRAMES.has(options.timeframe) &&
      isThinVolumeAnomaly(bar, medianVol, medianRange)
    ) {
      pushReject(rejected, options, {
        reason: "premarket-anomaly",
        message: `Thin-volume range outlier at time ${bar.time}`,
        bar,
        time: bar.time,
      });
      continue;
    }

    filtered.push(bar);
  }

  return { bars: filtered, rejected };
}

/** Convenience: return only clean bars (used by chart render path). */
export function sanitizeCandleBarsForChart(
  input: OHLCVBar[],
  options?: SanitizeCandleOptions
): OHLCVBar[] {
  return sanitizeCandleBars(input, options).bars;
}
