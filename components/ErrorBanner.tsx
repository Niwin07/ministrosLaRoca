"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Banner de error reutilizable. Se alimenta del searchParams.error que dejan
// las Server Actions al redirigir cuando fallan (patrón redirect→?error=→banner).
// Al mostrarse limpia el ?error de la URL (sin navegar ni mover el scroll),
// así una acción posterior que sale bien —y actualiza la página en el lugar—
// no vuelve a mostrar el error viejo. Se puede cerrar.
export function ErrorBanner({ message }: { message?: string | null }) {
  const [visible, setVisible] = useState<string | null>(message ?? null);

  useEffect(() => {
    if (!message) return;
    setVisible(message);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("error")) {
        url.searchParams.delete("error");
        window.history.replaceState(window.history.state, "", url.pathname + (url.search ? url.search : "") + url.hash);
      }
    } catch {}
  }, [message]);

  if (!visible) return null;
  return (
    <div role="alert" className="animate-desplegar flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-3 pl-4 pr-2 text-xs text-amber-700 dark:text-amber-400">
      <span className="mt-0.5 shrink-0 font-bold">!</span>
      <span className="min-w-0 flex-1">{visible}</span>
      <button type="button" onClick={() => setVisible(null)} aria-label="Cerrar aviso" className="-my-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-amber-500/15">
        <X size={13} aria-hidden />
      </button>
    </div>
  );
}
