import { AlertTriangle, Zap } from "lucide-react";
import type { AISummaryLocale } from "@/lib/ai/locale";
import { CardShell } from "./ai-ui";

interface CatalystCardProps {
  catalysts: string;
  risks: string;
  locale: AISummaryLocale;
}

/** Upcoming catalysts and key risks (server-component friendly). */
export function CatalystCard({ catalysts, risks, locale }: CatalystCardProps) {
  const title = locale === "zh" ? "催化剂与风险" : "Catalysts & Risks";
  const catalystsLabel = locale === "zh" ? "催化剂" : "Catalysts";
  const risksLabel = locale === "zh" ? "风险" : "Risks";
  const none = locale === "zh" ? "暂无明显项" : "None evident";

  return (
    <CardShell title={title} accent="neutral">
      <div className="flex flex-col gap-3">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
              {catalystsLabel}
            </span>
          </div>
          <p className="text-xs leading-[1.6] text-[var(--foreground)]/85">
            {catalysts || none}
          </p>
        </div>

        <div className="border-t border-[var(--border)]/50 pt-3">
          <div className="mb-1 flex items-center gap-1.5">
            <AlertTriangle
              className="h-3.5 w-3.5 text-[var(--negative)]"
              aria-hidden
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--negative)]">
              {risksLabel}
            </span>
          </div>
          <p className="text-xs leading-[1.6] text-[var(--foreground)]/85">
            {risks || none}
          </p>
        </div>
      </div>
    </CardShell>
  );
}
