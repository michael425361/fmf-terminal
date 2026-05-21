import { DashboardFrame } from "./DashboardFrame";
import { DashboardMain } from "./DashboardMain";
import { TerminalProviders } from "@/components/layout/TerminalProviders";

export async function Dashboard() {
  return (
    <TerminalProviders>
      <DashboardFrame main={<DashboardMain />} />
    </TerminalProviders>
  );
}
