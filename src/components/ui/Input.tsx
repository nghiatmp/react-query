import { cn } from "@/lib/utils/cn";
import { useId, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(
          "min-h-11 w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-60",
          error && "border-destructive focus:border-destructive",
          className,
        )}
        {...props}
      />
      {/* Hiển thị lỗi validate từ Zod (nếu có) */}
      {error && <span id={`${fieldId}-error`} className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
