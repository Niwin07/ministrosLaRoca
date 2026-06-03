import { esSeccion } from "@/lib/acordes";

interface Seccion {
  label:  string | null;
  rep:    string | null;
  lineas: string[];
}

function parsearLetra(letra: string): Seccion[] {
  const out: Seccion[] = [];
  let actual: Seccion | null = null;

  for (const raw of letra.replace(/\r\n?/g, "\n").split("\n")) {
    const t = raw.trim();

    if (esSeccion(raw)) {
      const m = t.match(/^\[([^\]]+)\]\s*(.*)$/);
      actual = {
        label: m ? m[1].trim() : t,
        rep:   m && m[2].trim() ? m[2].trim() : null,
        lineas: [],
      };
      out.push(actual);
      continue;
    }

    if (!actual) {
      actual = { label: null, rep: null, lineas: [] };
      out.push(actual);
    }
    actual.lineas.push(t);
  }

  // Recortar líneas en blanco al inicio/fin de cada sección.
  for (const s of out) {
    while (s.lineas.length && !s.lineas[0]) s.lineas.shift();
    while (s.lineas.length && !s.lineas[s.lineas.length - 1]) s.lineas.pop();
  }
  return out;
}

export function LyricViewer({ letra }: { letra: string }) {
  const secciones = parsearLetra(letra);

  return (
    <div className="space-y-5">
      {secciones.map((s, i) => (
        <div key={i}>
          {s.label && (
            <div className="mb-1.5 flex items-center gap-2 border-l-2 border-blue-500/60 pl-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-500">
                {s.label}
              </span>
              {s.rep && (
                <span className="rounded-full bg-input px-1.5 py-0.5 text-[9px] font-semibold text-mid">
                  {s.rep}
                </span>
              )}
            </div>
          )}

          <div className="space-y-0.5 text-sm leading-7">
            {s.lineas.length === 0 ? (
              s.rep && <p className="pl-2 text-xs italic text-gone">(se repite)</p>
            ) : (
              s.lineas.map((l, j) =>
                l ? (
                  <p key={j} className="text-hi">{l}</p>
                ) : (
                  <div key={j} className="h-2.5" />
                ),
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
