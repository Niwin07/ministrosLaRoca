import { IconoMarca, type IconoMarcaNombre } from "@/components/zarza/IconoMarca";

/**
 * Pantalla de carga del sistema Zarza. Aparece al instante al tocar un
 * enlace (Next la precarga), con el título real de la sección, mientras el
 * servidor arma los datos: la app responde al toque aunque la base tarde.
 */
export function EsqueletoPagina({
  titulo,
  sub,
  icono,
  tarjetas = 4,
  grilla = false,
  bloqueGrande = false,
}: {
  titulo?: string;
  sub?: string;
  icono?: IconoMarcaNombre;
  tarjetas?: number;
  grilla?: boolean;
  bloqueGrande?: boolean;
}) {
  return (
    <div aria-busy="true" aria-label="Cargando" className="flex flex-col gap-6 px-4 pb-8 pt-7 md:px-0 md:pt-2">
      {titulo ? (
        <div className="flex items-center gap-3">
          {icono && <span className="flex h-12 w-12 shrink-0 items-center justify-center"><IconoMarca nombre={icono} size={44} /></span>}
          <div className="min-w-0">
            <h1 className="font-display text-[26px] font-bold leading-[1.1] tracking-[-0.02em] text-hi">{titulo}</h1>
            {sub && <p className="mt-0.5 text-[13px] text-lo">{sub}</p>}
          </div>
        </div>
      ) : (
        <div className="esqueleto h-8 w-48 rounded-xl" />
      )}
      {bloqueGrande && <div className="esqueleto h-48 rounded-card" />}
      <div className={grilla ? "grid gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]" : "flex flex-col gap-2.5"}>
        {Array.from({ length: tarjetas }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-card/80 p-3.5" style={{ opacity: 1 - i * 0.12 }}>
            <div className="esqueleto h-10 w-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="esqueleto h-3.5 w-3/5 rounded-md" />
              <div className="esqueleto h-2.5 w-2/5 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
