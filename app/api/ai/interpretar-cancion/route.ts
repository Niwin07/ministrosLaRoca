import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { nombre, artista, textoLetra = "", textoCharts = "" } = (await req.json()) as {
      nombre: string;
      artista: string;
      textoLetra?: string;
      textoCharts?: string;
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY no configurada" }, { status: 500 });
    }

    // Buscar letra real en lyrics.ovh antes de pedirle al modelo que invente
    let letraExterna = "";
    if (!textoLetra.trim()) {
      try {
        const lyricRes = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(nombre)}`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (lyricRes.ok) {
          const lyricData = await lyricRes.json() as { lyrics?: string };
          letraExterna = lyricData.lyrics?.trim() ?? "";
        }
      } catch { /* ignorar si falla o timeout */ }
    }

    const seccionLetra = textoLetra.trim()
      ? `TEXTO DE LETRA (extraído de archivo):\n${textoLetra.trim()}`
      : letraExterna
      ? `TEXTO DE LETRA (fuente externa):\n${letraExterna}`
      : `LETRA: no disponible — si no conocés la letra con total certeza, devolvé el campo "letra" como string vacío (""). No inventes ni completes letras que no conozcas con seguridad.`;

    const seccionCharts = textoCharts.trim()
      ? `TEXTO DE ACORDES/CHARTS (extraído de archivo):\n${textoCharts.trim()}`
      : "ACORDES: (no se proporcionó texto — generá los charts completos usando tu conocimiento de la canción)";

    const prompt = `Sos un experto en cifrado de canciones de alabanza y adoración cristiana.

Te voy a dar el nombre de una canción, el artista, y opcionalmente texto crudo de la letra y/o de los acordes (pueden estar mal extraídos de un PDF).

Tu tarea:
1. Usar tu conocimiento de "${nombre}" de "${artista}" para corregir o completar lo que falte
2. Limpiar y formatear cada parte según las convenciones del sistema
3. Si se proporcionó texto de letra → usarlo como base para el campo "letra"
4. Si se proporcionó texto de acordes → usarlo como base para el campo "charts"
5. Si alguno falta → generarlo completo desde tu conocimiento

CONVENCIONES DEL SISTEMA:
- Secciones entre corchetes: [Intro], [Verso], [Verso 2], [Pre-Coro], [Coro], [Puente], [Outro]
- Acordes en notación real (ej: G, Am, C/E, Dsus4, Em7) — preferido
  O notación Nashville si el texto original los usa (1, 4, 5, 6m)
- En "charts": encabezado [Sección] seguido de los acordes línea por línea
- En "letra": encabezado [Sección] seguido de las estrofas
- Separar secciones con línea en blanco
- No incluir metadatos (CCLI, copyright, autores, URLs)
- IMPORTANTE — repeticiones: la PRIMERA vez que aparece una sección escribís el contenido completo.
  Si esa misma sección se repite después, escribís SOLO el encabezado (ej: [Coro]) sin repetir el texto.
  Esto aplica tanto a letra como a charts.

${seccionLetra}

${seccionCharts}

Devolvé ÚNICAMENTE un objeto JSON válido con exactamente estas dos claves, sin \`\`\`json ni explicaciones:
{"letra":"...","charts":"..."}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as { error?: { message?: string } };
      console.error("Groq error:", JSON.stringify(errData, null, 2));
      const status = res.status;
      if (status === 429) {
        return NextResponse.json({ error: "Límite de requests alcanzado. Esperá unos segundos y reintentá." }, { status: 429 });
      }
      if (status === 401 || status === 403) {
        return NextResponse.json({ error: "Clave de Groq inválida o sin permisos." }, { status: 403 });
      }
      return NextResponse.json({ error: "Error al llamar a la IA. Intentá de nuevo." }, { status: 502 });
    }

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content ?? "";

    const clean = raw
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "")
      .replace(/\\'/g, "'")
      .trim();

    let parsed: { letra?: string; charts?: string };
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("Parse error. Raw response:", raw);
      return NextResponse.json({ error: "La IA devolvió un formato inesperado. Intentá de nuevo." }, { status: 500 });
    }

    return NextResponse.json({ letra: parsed.letra ?? "", charts: parsed.charts ?? "" });
  } catch (err) {
    console.error("Error en interpretar-cancion:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
