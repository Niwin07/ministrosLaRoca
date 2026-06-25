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

    // ── Buscar letra en fuentes externas (solo si el usuario no proporcionó texto) ──
    let letraExterna = "";
    if (!textoLetra.trim()) {
      // Fuente 1: lyrics.ovh
      try {
        const r1 = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(nombre)}`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (r1.ok) {
          const d = await r1.json() as { lyrics?: string };
          letraExterna = d.lyrics?.trim() ?? "";
        }
      } catch { /* timeout o red */ }

      // Fuente 2: lrclib.net (fallback con mejor cobertura de música cristiana contemporánea)
      if (!letraExterna) {
        try {
          const r2 = await fetch(
            `https://lrclib.net/api/search?q=${encodeURIComponent(nombre)}&artist_name=${encodeURIComponent(artista)}`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (r2.ok) {
            const results = await r2.json() as { plainLyrics?: string }[];
            letraExterna = results[0]?.plainLyrics?.trim() ?? "";
          }
        } catch { /* timeout o red */ }
      }
    }

    // ── Construir secciones del prompt ──────────────────────────────────────────────
    const seccionLetra = textoLetra.trim()
      ? `LETRA (del archivo del usuario — formatear y estructurar):\n${textoLetra.trim()}`
      : letraExterna
      ? `LETRA (fuente externa — agregá los marcadores de sección [Verso]/[Coro]/etc. y formateá):\n${letraExterna}`
      : `LETRA: no disponible. Si no conocés la letra con total certeza, devolvé el campo "letra" como string vacío "". No inventes.`;

    const seccionCharts = textoCharts.trim()
      ? `ACORDES (del archivo del usuario — formatear y estructurar):\n${textoCharts.trim()}`
      : `ACORDES: no disponibles. Si no conocés los acordes con total certeza, devolvé el campo "charts" como string vacío "". No inventes.`;

    // ── Prompt con roles separados (mejor seguimiento de instrucciones en Llama 3.3) ─
    const systemMsg = `Sos un experto en cifrado de canciones de alabanza y adoración cristiana.
Tu tarea: limpiar, formatear y estructurar letra y acordes según estas convenciones:
- Secciones: [Intro] [Verso] [Verso 2] [Pre-Coro] [Coro] [Puente] [Outro]
- Acordes: notación real (G, Am, C/E, Dsus4, Em7) o Nashville (1, 4, 6m, 5)
- Primera aparición de una sección: contenido completo. Repeticiones: solo el encabezado.
- Sin metadatos (CCLI, copyright, autores, URLs).
- Separar secciones con una línea en blanco.
- Devolvé ÚNICAMENTE JSON válido: {"letra":"...","charts":"..."} sin bloques de código ni explicaciones.`;

    const userMsg = `Canción: "${nombre}" de "${artista}"

${seccionLetra}

${seccionCharts}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user",   content: userMsg   },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: "json_object" },
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
