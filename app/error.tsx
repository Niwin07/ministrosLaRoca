"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/Button";

/**
 * Error boundary de ruta — antes no existía ninguno, así que cualquier throw
 * no controlado (server action sin try/catch, fallo de DB) mostraba la
 * pantalla de error genérica de Next, fuera del lenguaje visual de la app.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
        <AlertTriangle size={24} className="text-red-500" aria-hidden />
      </div>
      <div>
        <h1 className="text-lg font-bold text-hi">Algo salió mal</h1>
        <p className="mt-1 max-w-xs text-sm text-lo">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
        </p>
      </div>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={reset}>
          Reintentar
        </Button>
        <Link href="/">
          <Button type="button" size="sm" icon={<Home size={14} />}>
            Ir al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
