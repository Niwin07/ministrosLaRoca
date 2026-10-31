"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Devuelve los ids que aparecieron desde el render anterior (no cuenta los
 * del primer render), para resaltar lo que se acaba de agregar. El resaltado
 * dura `ms` y después se limpia solo.
 */
export function useNuevos(ids: (number | string)[], ms = 1600): Set<number | string> {
  const conocidos = useRef<Set<number | string> | null>(null);
  const [nuevos, setNuevos] = useState<Set<number | string>>(new Set());
  const clave = ids.join(",");

  useEffect(() => {
    const actuales = new Set(ids);
    if (conocidos.current) {
      const recien = ids.filter((id) => !conocidos.current!.has(id));
      if (recien.length) {
        setNuevos(new Set(recien));
        const t = setTimeout(() => setNuevos(new Set()), ms);
        conocidos.current = actuales;
        return () => clearTimeout(t);
      }
    }
    conocidos.current = actuales;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return nuevos;
}

/**
 * La cascada de entrada (.escalonar) sólo para la primera aparición de la
 * lista: después se quita, para que lo que se agrega entre con su propia
 * animación (sin demora ni doble movimiento).
 */
export function useEscalonarInicial(ms = 1200): string {
  const [activo, setActivo] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setActivo(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return activo ? "escalonar" : "";
}
