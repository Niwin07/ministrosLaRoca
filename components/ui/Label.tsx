import type { ComponentProps } from "react";
import { FIELD_LABEL_CLS } from "./Input";

/** Label suelto (para checkboxes/radios/selects que no usan <Input>). */
export function Label({ className = "", ...rest }: ComponentProps<"label">) {
  return <label className={[FIELD_LABEL_CLS, className].filter(Boolean).join(" ")} {...rest} />;
}
