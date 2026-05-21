import { FMFLogo } from "@/components/brand/FMFLogo";
import { SITE } from "@/lib/brand/site";

export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--background)]">
      <FMFLogo size={64} pulse />
      <p className="mt-6 font-mono text-xs tracking-[0.25em] text-[var(--muted)]">
        {SITE.name}
      </p>
      <div className="mt-4 h-0.5 w-32 overflow-hidden rounded-full bg-[var(--border)]">
        <div className="boot-progress h-full w-1/3 rounded-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}
