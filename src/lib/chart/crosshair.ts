import { CrosshairMode, type ChartOptions } from "lightweight-charts";
import { CHART_COLORS } from "./theme";

/** Trading-terminal crosshair: free-moving vert + horz with axis labels. */
export function getProfessionalCrosshairOptions(): ChartOptions["crosshair"] {
  return {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: CHART_COLORS.crosshair,
      width: 1,
      style: 2,
      labelVisible: true,
      labelBackgroundColor: "#161b24",
    },
    horzLine: {
      color: CHART_COLORS.crosshair,
      width: 1,
      style: 2,
      labelVisible: true,
      labelBackgroundColor: "#161b24",
    },
  };
}
