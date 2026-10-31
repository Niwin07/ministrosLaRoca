"use client";

import { usePathname } from "next/navigation";
import { fondoDeRuta } from "@/lib/nav-items";

/**
 * Fondo "Zarza" de la sección actual (ver app/zarza-fondos.css).
 * Tres capas: base estática, llamas (se mueven con transform, compuestas en
 * GPU) y grano estático en su propia capa. Nada se repinta por frame.
 */
export function FondoSeccion() {
  const pathname = usePathname();
  return (
    <div aria-hidden="true" className={`fondo ${fondoDeRuta(pathname)}`}>
      <div className="fondo-llamas" />
      <div className="fondo-grano" />
    </div>
  );
}
