"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface CommentInputProps {
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  onSubmit: (body: string) => Promise<void> | void;
  onCancel?: () => void;
  compact?: boolean;
}

export function CommentInput({
  placeholder,
  submitLabel,
  autoFocus = false,
  onSubmit,
  onCancel,
  compact = false,
}: CommentInputProps) {
  const t = useTranslations("community.comments");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded border border-[var(--border)] bg-[var(--background)]",
        compact ? "p-2" : "p-3"
      )}
    >
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(false);
        }}
        placeholder={placeholder ?? t("placeholder")}
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        disabled={submitting}
        className={cn(
          "w-full resize-none bg-transparent text-xs leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]",
          error && "ring-1 ring-[var(--negative)]/50"
        )}
      />
      <p className="mt-1 font-mono text-[9px] text-[var(--muted)]">
        {t("tagHint")}
      </p>
      <div className="mt-2 flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {t("cancel")}
          </button>
        )}
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit()}
          className="inline-flex items-center gap-1.5 rounded border border-[var(--accent)]/50 bg-[var(--accent)] px-3 py-1.5 text-[10px] font-semibold text-[var(--background)] transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          {submitLabel ?? t("submit")}
        </button>
      </div>
    </div>
  );
}
