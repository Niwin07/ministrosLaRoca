"use client";

import { usePathname } from "next/navigation";
import { fondoDeRuta } from "@/lib/nav-items";

/**
 * Capa de fondo fija con el gradiente "Zarza" animado de la sección actual
 * (grano + llamas que se mueven lento). Va detrás de todo el contenido.
 * El movimiento se desactiva con prefers-reduced-motion (ver zarza-fondos.css).
 */
export function FondoSeccion() {
  const pathname = usePathname();
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 ${fondoDeRuta(pathname)}`}
    />
  );
}
