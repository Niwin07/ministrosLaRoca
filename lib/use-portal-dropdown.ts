"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

interface UsePortalDropdownOptions {
  open:    boolean;
  onClose: () => void;
  /** Calcula el estilo fijo del panel a partir del rect del trigger. Se recalcula cada vez que `open` pasa a true. */
  computeStyle: (rect: DOMRect) => CSSProperties;
}

interface UsePortalDropdownResult {
  triggerRef: RefObject<HTMLButtonElement | null>;
  panelRef:   RefObject<HTMLDivElement | null>;
  style:      CSSProperties;
}

/**
 * Posicionamiento + cierre (click afuera / Escape) compartido por los
 * dropdowns "portal" de la app (TonoSelect, CancionSelect). Antes cada uno
 * reimplementaba esta misma lógica por separado.
 */
export function usePortalDropdown({ open, onClose, computeStyle }: UsePortalDropdownOptions): UsePortalDropdownResult {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) return;

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setStyle(computeStyle(rect));

    function onMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // Solo se reposiciona/rearma al abrir — mismo comportamiento que antes de extraer el hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { triggerRef, panelRef, style };
}
