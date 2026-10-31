// Utilidades de YouTube para los módulos de videos (Calentamiento, Protocolo,
// Quiero mejorar). Sin API key: el id sale del link y el título/canal del
// endpoint público oEmbed. La duración no está disponible sin API key.

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extrae el id de 11 caracteres de cualquier link de YouTube (o el id suelto). */
export function youtubeId(entrada: string | null | undefined): string | null {
  const v = (entrada ?? "").trim();
  if (!v) return null;
  if (ID_RE.test(v)) return v;
  try {
    const url = new URL(v.startsWith("http") ? v : `https://${v}`);
    const host = url.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return ID_RE.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const q = url.searchParams.get("v");
      if (q && ID_RE.test(q)) return q;
      const partes = url.pathname.split("/").filter(Boolean);
      const i = partes.findIndex((p) => ["embed", "shorts", "live", "v"].includes(p));
      if (i >= 0 && ID_RE.test(partes[i + 1] ?? "")) return partes[i + 1];
    }
  } catch {
    /* link inválido */
  }
  return null;
}

export function youtubeMiniatura(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Título y canal del video vía oEmbed (público). Nunca lanza: devuelve null si falla. */
export async function youtubeInfo(id: string): Promise<{ titulo: string; canal: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youtubeUrl(id))}`,
      { signal: AbortSignal.timeout(4000), cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; author_name?: string };
    return { titulo: (data.title ?? "").slice(0, 255), canal: (data.author_name ?? "").slice(0, 150) };
  } catch {
    return null;
  }
}
