"use client";

import { useEffect, useRef } from "react";
import { setPlataformaEnCookie } from "@/app/actions/plataforma";

/**
 * Persiste la plataforma resuelta a la cookie sin recargar la página.
 * Se monta solo cuando la cookie está ausente o es inválida, para que
 * las navegaciones siguientes la lean directo sin consultar la BD.
 */
export function PlataformaCookieSetter({ id }: { id: number }) {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void setPlataformaEnCookie(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
