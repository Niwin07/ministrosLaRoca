"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { fondoDeRuta } from "@/lib/nav-items";
import { FONDOS_LLAMAS, type CapaLlama, type FondoLlamas } from "@/lib/fondos-llamas";

// Resolución del lienzo respecto del viewport: las llamas son manchas muy
// difusas, así que dibujarlas a 1/4 y dejar que el navegador las escale no se
// nota y cuesta casi nada por cuadro.
const ESCALA = 1 / 4;
const FPS = 24;

/**
 * Fondo "Zarza" de la sección actual, fiel al diseño: cada llama se mueve por
 * su cuenta (el diseño anima background-position de cada degradé). En vez de
 * repintar degradés a pantalla completa en CSS —lo que daba lag— las llamas
 * se dibujan en un <canvas> chico que el navegador escala. La base y el grano
 * siguen en CSS (app/zarza-fondos.css), y una primera imagen estática de las
 * llamas queda de respaldo hasta que arranca el lienzo.
 */
export function FondoSeccion() {
  const pathname = usePathname();
  const seccion = fondoDeRuta(pathname);
  const contenedor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = lienzo.current;
    const caja = contenedor.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !caja || !ctx) return;

    const datos = FONDOS_LLAMAS[seccion.replace("fondo-", "")];
    if (!datos) return;

    const html = document.documentElement;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
    let fondo: FondoLlamas = html.classList.contains("dark") ? datos.oscuro : datos.claro;
    let ancho = 0;
    let alto = 0;
    let raf = 0;
    let ultimo = -Infinity;
    const inicio = performance.now();

    function medir() {
      ancho = window.innerWidth;
      alto = window.innerHeight;
      canvas!.width = Math.max(1, Math.round(ancho * ESCALA));
      canvas!.height = Math.max(1, Math.round(alto * ESCALA));
    }

    function dibujar(ahora: number) {
      const t = ((ahora - inicio) / 1000 / fondo.dur) % 1;
      // Tramo del ciclo e interpolación lineal (como el keyframe del diseño).
      const { tiempos, pos } = fondo;
      let k = 0;
      while (k < tiempos.length - 2 && t > tiempos[k + 1]) k++;
      const f = (t - tiempos[k]) / (tiempos[k + 1] - tiempos[k] || 1);

      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx!.setTransform(ESCALA, 0, 0, ESCALA, 0, 0);

      const bw = ancho * 1.5;
      const bh = alto * 1.5;
      // Igual que en CSS: la primera capa va arriba, así que se dibuja al final.
      for (let i = fondo.capas.length - 1; i >= 0; i--) {
        const a = pos[k][i];
        const b = pos[k + 1][i];
        const px = a[0] + (b[0] - a[0]) * f;
        const py = a[1] + (b[1] - a[1]) * f;
        // background-position p% con caja de 150% → desplazamiento p·(100% − 150%).
        pintarCapa(ctx!, fondo.capas[i], -0.5 * ancho * px, -0.5 * alto * py, bw, bh, ancho, alto);
      }
    }

    function cuadro(ahora: number) {
      raf = requestAnimationFrame(cuadro);
      if (ahora - ultimo < 1000 / FPS) return;
      ultimo = ahora;
      dibujar(ahora);
    }

    function arrancar() {
      cancelAnimationFrame(raf);
      medir();
      dibujar(performance.now());
      if (!reducir.matches) raf = requestAnimationFrame(cuadro);
    }

    // Cambio de tema (clase .dark en <html>): pasa a las llamas de noche/día.
    const obs = new MutationObserver(() => {
      const nuevo = html.classList.contains("dark") ? datos.oscuro : datos.claro;
      if (nuevo !== fondo) { fondo = nuevo; dibujar(performance.now()); }
    });
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });

    const alRedimensionar = () => { medir(); dibujar(performance.now()); };
    window.addEventListener("resize", alRedimensionar);
    reducir.addEventListener("change", arrancar);

    arrancar();
    caja.classList.add("con-lienzo");

    return () => {
      cancelAnimationFrame(raf);
      obs.disconnect();
      window.removeEventListener("resize", alRedimensionar);
      reducir.removeEventListener("change", arrancar);
      caja.classList.remove("con-lienzo");
    };
  }, [seccion]);

  return (
    <div ref={contenedor} aria-hidden="true" className={`fondo ${seccion}`}>
      <div className="fondo-llamas" />
      <canvas ref={lienzo} className="fondo-lienzo" />
      <div className="fondo-grano" />
    </div>
  );
}

/** Dibuja un degradé del diseño (elipse radial o banda lineal) en su caja. */
function pintarCapa(
  ctx: CanvasRenderingContext2D,
  capa: CapaLlama,
  ox: number,
  oy: number,
  bw: number,
  bh: number,
  ancho: number,
  alto: number,
) {
  let g: CanvasGradient;
  if (capa.lin !== undefined) {
    // linear-gradient(Ndeg) dentro de la caja: la línea pasa por el centro;
    // 0deg apunta hacia arriba y gira en sentido horario.
    const rad = (capa.lin * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const largo = Math.abs(bw * dx) + Math.abs(bh * dy);
    const cx = ox + bw / 2;
    const cy = oy + bh / 2;
    g = ctx.createLinearGradient(cx - (dx * largo) / 2, cy - (dy * largo) / 2, cx + (dx * largo) / 2, cy + (dy * largo) / 2);
    for (const [color, p] of capa.stops) g.addColorStop(Math.min(1, Math.max(0, p)), color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ancho, alto);
    return;
  }

  // radial-gradient(ellipse rx ry at cx cy): un círculo de radio 1 escalado.
  const cx = ox + capa.cx * bw;
  const cy = oy + capa.cy * bh;
  const rx = Math.max(1e-3, capa.rx * bw);
  const ry = Math.max(1e-3, capa.ry * bh);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx, ry);
  g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  for (const [color, p] of capa.stops) g.addColorStop(Math.min(1, Math.max(0, p)), color);
  ctx.fillStyle = g;
  // Sólo hace falta cubrir el viewport (fuera del radio el degradé es transparente).
  ctx.fillRect(-cx / rx, -cy / ry, ancho / rx, alto / ry);
  ctx.restore();
}
