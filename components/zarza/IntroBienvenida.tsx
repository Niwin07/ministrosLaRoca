"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

type Fase = "oculta" | "entrada" | "zoom" | "fin";

const INTRO_MS = 2200;
const ZOOM_MS = 1200;
const CLAVE = "roca-bienvenida-vista";

/**
 * Bienvenida (diseño "Bienvenida · primera vez"): la primera vez que alguien
 * abre la app, el logo arde en el centro sobre brasa, hace zoom out hacia su
 * lugar y aparece el login. Se muestra una sola vez por dispositivo y se
 * saltea con "reducir movimiento".
 */
export function IntroBienvenida() {
  const [fase, setFase] = useState<Fase>("oculta");

  useEffect(() => {
    let vista = false;
    try { vista = localStorage.getItem(CLAVE) === "1"; } catch {}
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (vista || reducir) return;
    try { localStorage.setItem(CLAVE, "1"); } catch {}
    setFase("entrada");
    const t1 = setTimeout(() => setFase("zoom"), INTRO_MS);
    const t2 = setTimeout(() => setFase("fin"), INTRO_MS + ZOOM_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (fase === "oculta" || fase === "fin") return null;
  const entrada = fase === "entrada";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[300]"
      style={{ transition: `opacity ${ZOOM_MS}ms ease-in-out`, opacity: entrada ? 1 : 0 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(60% 45% at 50% 46%, #6a1a0a 0%, #2b0a06 55%, #140503 100%)" }}
      />
      <div
        className="absolute left-1/2 w-[180px] sm:w-[230px]"
        style={{
          top: entrada ? "50%" : "28%",
          transform: `translate(-50%, -50%) scale(${entrada ? 1.6 : 1})`,
          transition: `top ${ZOOM_MS}ms cubic-bezier(0.65,0,0.35,1), transform ${ZOOM_MS}ms cubic-bezier(0.65,0,0.35,1)`,
        }}
      >
        <div className="intro-logo-arde">
          <img src="/zarza/logo-zarza.webp" alt="" width={720} height={872} className="h-auto w-full" />
        </div>
      </div>
      <style>{`
        @keyframes intro-arde { 0%,100% { filter: drop-shadow(0 0 18px rgba(240,138,42,0.55)) brightness(1); } 50% { filter: drop-shadow(0 0 34px rgba(232,40,10,0.7)) brightness(1.08); } }
        .intro-logo-arde { animation: intro-arde 1.1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
