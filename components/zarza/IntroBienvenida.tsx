"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Fase = "oculta" | "entrada" | "zoom" | "fin";

const INTRO_MS = 2200;
const ZOOM_MS = 1200;
const CLAVE = "roca-bienvenida-vista";

// Ascuas que suben desde abajo mientras arde el logo (posiciones fijas para
// que el render sea estable).
const ASCUAS = [
  { left: "12%", delay: "0s",    dur: "3.4s", deriva: "18px",  size: 4 },
  { left: "24%", delay: "1.1s",  dur: "3.9s", deriva: "-10px", size: 3 },
  { left: "35%", delay: "0.5s",  dur: "3.1s", deriva: "14px",  size: 5 },
  { left: "46%", delay: "1.7s",  dur: "3.6s", deriva: "-16px", size: 3 },
  { left: "55%", delay: "0.2s",  dur: "3.3s", deriva: "10px",  size: 4 },
  { left: "64%", delay: "1.4s",  dur: "4s",   deriva: "-20px", size: 3 },
  { left: "73%", delay: "0.8s",  dur: "3.2s", deriva: "12px",  size: 5 },
  { left: "84%", delay: "1.9s",  dur: "3.7s", deriva: "-12px", size: 4 },
  { left: "92%", delay: "0.4s",  dur: "3.5s", deriva: "8px",   size: 3 },
];

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
    const html = document.documentElement;
    if (vista || reducir) { delete html.dataset.intro; return; }
    try { localStorage.setItem(CLAVE, "1"); } catch {}
    // La pantalla de login espera (animación en pausa) y entra al terminar.
    html.dataset.intro = "1";
    setFase("entrada");
    const t1 = setTimeout(() => setFase("zoom"), INTRO_MS);
    const t2 = setTimeout(() => { delete html.dataset.intro; }, INTRO_MS + ZOOM_MS * 0.6);
    const t3 = setTimeout(() => setFase("fin"), INTRO_MS + ZOOM_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); delete html.dataset.intro; };
  }, []);

  if (fase === "oculta" || fase === "fin") return null;
  const entrada = fase === "entrada";

  // Se monta en <body> para quedar fuera de la animación de entrada de la pantalla.
  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[300]"
      style={{ transition: `opacity ${ZOOM_MS}ms ease-in-out`, opacity: entrada ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ background: "radial-gradient(60% 45% at 50% 46%, #6a1a0a 0%, #2b0a06 55%, #140503 100%)" }}
      >
        {ASCUAS.map((a, i) => (
          <span
            key={i}
            className="ascua"
            style={{ left: a.left, animationDelay: a.delay, animationDuration: a.dur, ["--deriva" as string]: a.deriva, width: a.size, height: a.size }}
          />
        ))}
      </div>
      <div
        className="absolute left-1/2 w-[180px] sm:w-[230px]"
        style={{
          top: entrada ? "50%" : "28%",
          transform: `translate(-50%, -50%) scale(${entrada ? 1.6 : 1})`,
          transition: `top ${ZOOM_MS}ms cubic-bezier(0.65,0,0.35,1), transform ${ZOOM_MS}ms cubic-bezier(0.65,0,0.35,1)`,
        }}
      >
        <div className="intro-logo-entra"><div className="intro-logo-arde">
          <img src="/zarza/logo-zarza.webp" alt="" width={720} height={872} className="h-auto w-full" />
        </div></div>
      </div>
      <style>{`
        @keyframes intro-arde { 0%,100% { filter: drop-shadow(0 0 18px rgba(240,138,42,0.55)) brightness(1); } 50% { filter: drop-shadow(0 0 34px rgba(232,40,10,0.7)) brightness(1.08); } }
        .intro-logo-arde { animation: intro-arde 1.1s ease-in-out infinite; }
      `}</style>
    </div>,
    document.body,
  );
}

/**
 * Script inline para el <head> del login: marca la intro antes del primer
 * pintado para que la pantalla quede en pausa (invisible) desde el inicio.
 */
export const SCRIPT_INTRO = `try{if(localStorage.getItem('${CLAVE}')!=='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.intro='1'}catch(e){}`;
