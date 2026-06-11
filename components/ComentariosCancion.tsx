"use client";

import { useRef, useTransition } from "react";
import { ChevronDown, MessageCircle, Send, Trash2 } from "lucide-react";

export interface Comentario {
  id_comentario:    number;
  id_lista_cancion: number;
  id_usuario:       number;
  nombre_usuario:   string;
  texto:            string;
  creadoEn:         string | null;
}

interface Props {
  id_lista_cancion:     number;
  comentarios:          Comentario[];
  usuarioActualId:      number;
  puedeModerar:         boolean;
  onComentar:           (formData: FormData) => Promise<void>;
  onEliminarComentario: (formData: FormData) => Promise<void>;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1)  return "ahora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/**
 * Sección colapsable de comentarios de una canción dentro de una lista.
 * Acuerdos del ensayo que antes se perdían en WhatsApp.
 */
export function ComentariosCancion({
  id_lista_cancion,
  comentarios,
  usuarioActualId,
  puedeModerar,
  onComentar,
  onEliminarComentario,
}: Props) {
  const [enviando, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await onComentar(formData);
      formRef.current?.reset();
    });
  }

  return (
    <details className="group/comentarios border-t border-line">
      <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-gone transition-colors hover:text-mid [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5">
          <MessageCircle size={11} />
          Comentarios{comentarios.length > 0 ? ` (${comentarios.length})` : ""}
        </span>
        <ChevronDown size={12} className="transition-transform duration-200 group-open/comentarios:rotate-180" />
      </summary>

      <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
        {comentarios.length === 0 && (
          <p className="text-xs text-gone">Sin comentarios. Dejá acá los acuerdos del ensayo.</p>
        )}

        {comentarios.map((c) => {
          const puedeBorrar = puedeModerar || c.id_usuario === usuarioActualId;
          return (
            <div key={c.id_comentario} className="flex items-start gap-2.5">
              <div className="min-w-0 flex-1 rounded-xl bg-input px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] font-semibold text-mid">{c.nombre_usuario}</span>
                  <span className="shrink-0 text-[10px] text-gone">{timeAgo(c.creadoEn)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-hi">{c.texto}</p>
              </div>
              {puedeBorrar && (
                <form action={onEliminarComentario} className="shrink-0">
                  <input type="hidden" name="id_comentario" value={c.id_comentario} />
                  <button
                    type="submit"
                    aria-label="Borrar comentario"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-gone transition-colors hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={11} />
                  </button>
                </form>
              )}
            </div>
          );
        })}

        <form ref={formRef} action={handleSubmit} className="flex gap-2">
          <input type="hidden" name="id_lista_cancion" value={id_lista_cancion} />
          <input
            name="texto"
            required
            maxLength={500}
            placeholder="Agregar comentario…"
            disabled={enviando}
            className="min-w-0 flex-1 rounded-xl border border-mark bg-input px-3 py-2 text-xs text-hi placeholder-gone outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={enviando}
            aria-label="Enviar comentario"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </details>
  );
}
