"use server";

// Server Actions de los módulos de contenido del rediseño "Zarza":
// Calentamiento de voces, Protocolo de sonido y Quiero mejorar.
// Toda escritura exige sesión con rol ADMINISTRADOR o LIDER.

import { db } from "@/db";
import {
  calentamiento_ejercicios,
  calentamiento_videos,
  protocolo_pasos,
  mejorar_categorias,
  mejorar_videos,
} from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { puedeEditarContenido, COLORES_CATEGORIA, ICONOS_CATEGORIA } from "@/lib/modulos";
import { youtubeId, youtubeInfo } from "@/lib/youtube";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

async function assertEditor(): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");
  if (!puedeEditarContenido(session.user.rol)) throw new Error("Sin permisos para editar este contenido.");
}

function texto(fd: FormData, campo: string, max: number): string {
  return String(fd.get(campo) ?? "").trim().slice(0, max);
}

function idDe(fd: FormData, campo = "id"): number {
  const n = Number(fd.get(campo));
  if (!Number.isInteger(n) || n <= 0) throw new Error("Identificador inválido.");
  return n;
}

async function ejecutar(fn: () => Promise<void>, rutas: string[]): Promise<ResultadoAccion> {
  try {
    await assertEditor();
    await fn();
    rutas.forEach((r) => revalidatePath(r));
    return { ok: true };
  } catch (e) {
    console.error("contenido:", e);
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo guardar." };
  }
}

// ─── Movimiento de orden genérico (subir / bajar) ────────────────────────────

type TablaOrdenable =
  | typeof calentamiento_ejercicios
  | typeof calentamiento_videos
  | typeof protocolo_pasos
  | typeof mejorar_videos;

async function mover(
  tabla: TablaOrdenable,
  idCol: Parameters<typeof eq>[0],
  ordenCol: Parameters<typeof eq>[0],
  id: number,
  direccion: "arriba" | "abajo",
  filtro?: ReturnType<typeof eq>,
) {
  await db.transaction(async (tx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filas = (await (tx as any)
      .select({ id: idCol, orden: ordenCol })
      .from(tabla)
      .where(filtro)
      .orderBy(asc(ordenCol), asc(idCol))) as { id: number; orden: number }[];
    const i = filas.findIndex((f) => f.id === id);
    const j = direccion === "arriba" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= filas.length) return;
    [filas[i], filas[j]] = [filas[j], filas[i]];
    // Renumera 1..n para que el orden quede compacto.
    for (let k = 0; k < filas.length; k++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx as any).update(tabla).set({ orden: k + 1 }).where(eq(idCol, filas[k].id));
    }
  });
}

async function siguienteOrden(ordenCol: Parameters<typeof eq>[0], tabla: TablaOrdenable | typeof mejorar_categorias, filtro?: ReturnType<typeof eq>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fila] = await (db as any)
    .select({ max: sql<number>`COALESCE(MAX(${ordenCol}), 0)` })
    .from(tabla)
    .where(filtro);
  return Number(fila?.max ?? 0) + 1;
}

// ─── Calentamiento: ejercicios ───────────────────────────────────────────────

const RUTA_CALENT = ["/calentamiento", "/"];

export async function guardarEjercicio(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    const nombre = texto(fd, "nombre", 150);
    const descripcion = texto(fd, "descripcion", 2000) || null;
    if (!nombre) throw new Error("Poné el nombre del ejercicio.");
    const id = Number(fd.get("id")) || 0;
    if (id) {
      await db.update(calentamiento_ejercicios).set({ nombre, descripcion }).where(eq(calentamiento_ejercicios.id_ejercicio, id));
    } else {
      const orden = await siguienteOrden(calentamiento_ejercicios.orden, calentamiento_ejercicios);
      await db.insert(calentamiento_ejercicios).values({ nombre, descripcion, orden });
    }
  }, RUTA_CALENT);
}

export async function eliminarEjercicio(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    await db.delete(calentamiento_ejercicios).where(eq(calentamiento_ejercicios.id_ejercicio, idDe(fd)));
  }, RUTA_CALENT);
}

export async function moverEjercicio(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    await mover(calentamiento_ejercicios, calentamiento_ejercicios.id_ejercicio, calentamiento_ejercicios.orden, idDe(fd), fd.get("dir") === "arriba" ? "arriba" : "abajo");
  }, RUTA_CALENT);
}

// ─── Calentamiento: videos ───────────────────────────────────────────────────

export async function guardarVideoCalentamiento(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    const id = Number(fd.get("id")) || 0;
    let titulo = texto(fd, "titulo", 255);
    if (id) {
      if (!titulo) throw new Error("Poné un título.");
      await db.update(calentamiento_videos).set({ titulo }).where(eq(calentamiento_videos.id_video, id));
      return;
    }
    const yt = youtubeId(texto(fd, "url", 500));
    if (!yt) throw new Error("El link de YouTube no es válido.");
    if (!titulo) titulo = (await youtubeInfo(yt))?.titulo || "Video de calentamiento";
    const orden = await siguienteOrden(calentamiento_videos.orden, calentamiento_videos);
    await db.insert(calentamiento_videos).values({ youtube_id: yt, titulo, orden });
  }, RUTA_CALENT);
}

export async function eliminarVideoCalentamiento(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    await db.delete(calentamiento_videos).where(eq(calentamiento_videos.id_video, idDe(fd)));
  }, RUTA_CALENT);
}

export async function moverVideoCalentamiento(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    await mover(calentamiento_videos, calentamiento_videos.id_video, calentamiento_videos.orden, idDe(fd), fd.get("dir") === "arriba" ? "arriba" : "abajo");
  }, RUTA_CALENT);
}

// ─── Protocolo de sonido ─────────────────────────────────────────────────────

const RUTA_PROTO = ["/protocolo", "/"];

export async function guardarPaso(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    const titulo = texto(fd, "titulo", 200);
    const detalle = texto(fd, "detalle", 2000) || null;
    const url = texto(fd, "url", 500);
    if (!titulo) throw new Error("Escribí qué hay que hacer en este paso.");
    const youtube_id = url ? youtubeId(url) : null;
    if (url && !youtube_id) throw new Error("El link de YouTube no es válido.");
    const id = Number(fd.get("id")) || 0;
    if (id) {
      await db.update(protocolo_pasos).set({ titulo, detalle, youtube_id }).where(eq(protocolo_pasos.id_paso, id));
    } else {
      const orden = await siguienteOrden(protocolo_pasos.orden, protocolo_pasos);
      await db.insert(protocolo_pasos).values({ titulo, detalle, youtube_id, orden });
    }
  }, RUTA_PROTO);
}

export async function eliminarPaso(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    await db.delete(protocolo_pasos).where(eq(protocolo_pasos.id_paso, idDe(fd)));
  }, RUTA_PROTO);
}

export async function moverPaso(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    await mover(protocolo_pasos, protocolo_pasos.id_paso, protocolo_pasos.orden, idDe(fd), fd.get("dir") === "arriba" ? "arriba" : "abajo");
  }, RUTA_PROTO);
}

// ─── Quiero mejorar: categorías ──────────────────────────────────────────────

const RUTA_MEJORAR = ["/mejorar", "/"];

export async function guardarCategoria(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    const nombre = texto(fd, "nombre", 100);
    if (!nombre) throw new Error("Poné un nombre para la categoría.");
    const colorIn = texto(fd, "color", 20);
    const color = colorIn in COLORES_CATEGORIA ? colorIn : "llama";
    const iconoIn = texto(fd, "icono", 30);
    const icono = (ICONOS_CATEGORIA as readonly string[]).includes(iconoIn) ? iconoIn : "mejorar";
    const id = Number(fd.get("id")) || 0;
    if (id) {
      await db.update(mejorar_categorias).set({ nombre, color, icono }).where(eq(mejorar_categorias.id_categoria, id));
    } else {
      const orden = await siguienteOrden(mejorar_categorias.orden, mejorar_categorias);
      await db.insert(mejorar_categorias).values({ nombre, color, icono, orden });
    }
  }, RUTA_MEJORAR);
}

export async function eliminarCategoria(fd: FormData): Promise<ResultadoAccion> {
  return ejecutar(async () => {
    // Los videos de la categoría se borran por ON DELETE CASCADE.
    await db.delete(mejorar_categorias).where(eq(mejorar_categorias.id_categoria, idDe(fd)));
  }, RUTA_MEJORAR);
}

// ─── Quiero mejorar: videos ──────────────────────────────────────────────────

export async function guardarVideoMejorar(fd: FormData): Promise<ResultadoAccion> {
  const id_categoria = Number(fd.get("id_categoria")) || 0;
  return ejecutar(async () => {
    if (!id_categoria) throw new Error("Categoría inválida.");
    const id = Number(fd.get("id")) || 0;
    let titulo = texto(fd, "titulo", 255);
    if (id) {
      if (!titulo) throw new Error("Poné un título.");
      await db.update(mejorar_videos).set({ titulo }).where(and(eq(mejorar_videos.id_video, id), eq(mejorar_videos.id_categoria, id_categoria)));
      return;
    }
    const yt = youtubeId(texto(fd, "url", 500));
    if (!yt) throw new Error("El link de YouTube no es válido.");
    const info = await youtubeInfo(yt);
    if (!titulo) titulo = info?.titulo || "Video";
    const orden = await siguienteOrden(mejorar_videos.orden, mejorar_videos, eq(mejorar_videos.id_categoria, id_categoria));
    await db.insert(mejorar_videos).values({ id_categoria, youtube_id: yt, titulo, canal: info?.canal || null, orden });
  }, [...RUTA_MEJORAR, `/mejorar/${id_categoria}`]);
}

export async function eliminarVideoMejorar(fd: FormData): Promise<ResultadoAccion> {
  const id_categoria = Number(fd.get("id_categoria")) || 0;
  return ejecutar(async () => {
    await db.delete(mejorar_videos).where(eq(mejorar_videos.id_video, idDe(fd)));
  }, [...RUTA_MEJORAR, `/mejorar/${id_categoria}`]);
}

export async function moverVideoMejorar(fd: FormData): Promise<ResultadoAccion> {
  const id_categoria = Number(fd.get("id_categoria")) || 0;
  return ejecutar(async () => {
    await mover(mejorar_videos, mejorar_videos.id_video, mejorar_videos.orden, idDe(fd), fd.get("dir") === "arriba" ? "arriba" : "abajo", eq(mejorar_videos.id_categoria, id_categoria));
  }, [`/mejorar/${id_categoria}`]);
}
