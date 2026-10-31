"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Lista cuyos elementos salen con animación cuando desaparecen (al borrar),
 * mientras el resto se acomoda deslizándose. Sirve también con hijos que
 * vienen de un Server Component: cada hijo necesita su `key`.
 */
export function ListaAnimada({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reducir = useReducedMotion();
  return (
    <div className={className}>
      <AnimatePresence initial={false} mode="popLayout">
        {Children.toArray(children).map((hijo) =>
          isValidElement(hijo) ? (
            <motion.div
              key={hijo.key}
              layout={!reducir}
              initial={reducir ? false : { opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducir ? { opacity: 0 } : { opacity: 0, x: -24, scale: 0.94, transition: { duration: 0.22 } }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            >
              {hijo}
            </motion.div>
          ) : null,
        )}
      </AnimatePresence>
    </div>
  );
}

/** Animación de salida estándar para ítems que ya son motion.* (Reorder.Item, etc.). */
export const SALIDA_ITEM = {
  initial: { opacity: 0, y: -8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -28, scale: 0.94, transition: { duration: 0.22 } },
};
