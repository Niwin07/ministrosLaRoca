import type { ComponentProps } from "react";

export interface InputProps extends ComponentProps<"input"> {
  label?:            string;
  hint?:              string;
  error?:             string;
  wrapperClassName?: string;
}

export const FIELD_CLS =
  "w-full rounded-xl border border-mark bg-input px-4 py-3 text-sm text-hi placeholder:text-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50";

export const FIELD_LABEL_CLS = "text-xs font-medium uppercase tracking-wider text-lo";

/**
 * Input de formulario estándar de la app: encapsula la clase Tailwind que
 * antes se retipeaba a mano en ~6 archivos, y siempre asocia un <label> real
 * (nunca placeholder-as-label) vía htmlFor/id.
 */
export function Input({
  label,
  hint,
  error,
  id,
  name,
  className = "",
  wrapperClassName = "",
  ...rest
}: InputProps) {
  const inputId = id ?? name;

  return (
    <div className={["flex flex-col gap-1.5", wrapperClassName].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={inputId} className={FIELD_LABEL_CLS}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        className={[
          FIELD_CLS,
          error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-[11px] text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[11px] text-gone">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
