"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Red de seguridad final — se activa solo si el propio root layout (o algo
 * fuera del alcance de app/error.tsx) lanza. Reemplaza <html>/<body> enteros,
 * por eso no puede depender de cookies()/sesión: usa el tema oscuro por defecto.
 */
export default function GlobalError({
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
    <html lang="es" className="dark">
      <body className="antialiased">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-base px-4 text-center text-hi">
          <h1 className="text-lg font-bold">Algo salió mal</h1>
          <p className="max-w-xs text-sm text-lo">
            Ocurrió un error inesperado al cargar la aplicación. Probá recargar la página.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
