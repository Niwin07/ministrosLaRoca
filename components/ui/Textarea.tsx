import type { ComponentProps } from "react";
import { FIELD_CLS, FIELD_LABEL_CLS } from "./Input";

export interface TextareaProps extends ComponentProps<"textarea"> {
  label?:            string;
  hint?:              string;
  error?:             string;
  wrapperClassName?: string;
}

/** Textarea con el mismo tratamiento visual/label que <Input>. */
export function Textarea({
  label,
  hint,
  error,
  id,
  name,
  className = "",
  wrapperClassName = "",
  ...rest
}: TextareaProps) {
  const textareaId = id ?? name;

  return (
    <div className={["flex flex-col gap-1.5", wrapperClassName].filter(Boolean).join(" ")}>
      {label && (
        <label htmlFor={textareaId} className={FIELD_LABEL_CLS}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        className={[
          FIELD_CLS,
          error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="text-[11px] text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${textareaId}-hint`} className="text-[11px] text-gone">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
