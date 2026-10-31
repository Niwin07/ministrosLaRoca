"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Fondo de la opción activa que se desliza entre opciones (pestañas,
 * selector de plataforma, navegación). Se ubica detrás del contenido del
 * botón, que debe ser `relative`; varias instancias en la misma pantalla se
 * separan envolviendo cada grupo en <LayoutGroup id>.
 */
export function PildoraActiva({
  className = "rounded-full bg-fuego-600 shadow-[0_4px_12px_-4px_rgba(180,71,42,0.55)]",
  id = "pildora",
}: {
  className?: string;
  id?: string;
}) {
  const reducir = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      layoutId={id}
      className={`absolute inset-0 ${className}`}
      transition={reducir ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38, mass: 0.8 }}
    />
  );
}
