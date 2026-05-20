"use client";

import { forwardRef } from "react";
import { Command, Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isCommandMode: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ value, onChange, onKeyDown, isCommandMode }, ref) {
    const t = useTranslations("commandPalette");

    return (
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-3">
        {isCommandMode ? (
          <Command className="h-4 w-4 shrink-0 text-[var(--accent)]" />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        )}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder")}
          className="flex-1 bg-transparent font-mono text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-controls="command-palette-results"
        />
        <kbd className="hidden rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--muted)] sm:inline">
          ESC
        </kbd>
      </div>
    );
  }
);
