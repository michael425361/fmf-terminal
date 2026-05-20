"use client";

import Image from "next/image";
import { BRAND_ASSETS } from "@/lib/brand/site";
import { cn } from "@/lib/utils";

interface FMFLogoProps {
  size?: number;
  className?: string;
  pulse?: boolean;
  priority?: boolean;
}

export function FMFLogo({
  size = 32,
  className,
  pulse = false,
  priority = false,
}: FMFLogoProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        pulse && "fmf-logo-pulse",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={BRAND_ASSETS.logo}
        alt="FMF Terminal — For My Finance"
        width={size}
        height={size}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className="h-full w-full object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]"
      />
    </span>
  );
}
