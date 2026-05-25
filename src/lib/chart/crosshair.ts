import { CrosshairMode, type ChartOptions } from "lightweight-charts";
import { CHART_COLORS } from "./theme";

/** Trading-terminal crosshair: free-moving vert + horz with axis labels. */
export function getProfessionalCrosshairOptions(): ChartOptions["crosshair"] {
  return {
    mode: CrosshairMode.Normal,
    doNotSnapToHiddenSeriesIndices: false,
    vertLine: {
      visible: true,
      color: CHART_COLORS.crosshair,
      width: 1,
      style: 2,
      labelVisible: true,
      labelBackgroundColor: "#161b24",
    },
    horzLine: {
      visible: true,
      color: CHART_COLORS.crosshair,
      width: 1,
      style: 2,
      labelVisible: true,
      labelBackgroundColor: "#161b24",
    },
  };
}
