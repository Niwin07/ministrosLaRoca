"use client";

import { useRef, useState } from "react";
import { BotonConfirmado } from "@/components/zarza/Confirmacion";
import { Camera, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Avatar } from "@/components/Avatar";

interface FotoPerfilProps {
  foto:         string | null;
  nombre:       string;
  onActualizar: (formData: FormData) => Promise<void>;
}

/**
 * Redimensiona una imagen a un cuadrado de `size`px (recorte centrado tipo
 * cover) y la exporta como JPEG comprimido en data URL. Todo en el cliente —
 * así nunca subimos el archivo original pesado al servidor.
 */
function redimensionar(file: File, size: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Sin contexto de canvas."));
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });
}

export function FotoPerfil({ foto, nombre, onActualizar }: FotoPerfilProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const mostrada = preview ?? foto;

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-elegir el mismo archivo
    if (!file) return;
    setProcesando(true);
    try {
      setPreview(await redimensionar(file, 256, 0.85));
    } catch {
      /* archivo inválido — se ignora */
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar (foto actual o preview) */}
      <div className="relative shrink-0">
        <Avatar foto={mostrada} nombre={nombre} size={80} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={procesando}
          aria-label="Elegir foto"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-violet-600 text-white shadow-sm transition-colors hover:bg-violet-500 disabled:opacity-60"
        >
          <Camera size={14} />
        </button>
      </div>

      {/* Controles */}
      <div className="flex min-w-0 flex-col gap-2">
        {preview ? (
          <form action={onActualizar} onSubmit={() => setPreview(null)} className="flex items-center gap-2">
            <input type="hidden" name="foto" value={preview} />
            <Button type="submit" size="sm" icon={<Check size={13} />}>
              Guardar foto
            </Button>
            <Button type="button" variant="ghost" size="sm" icon={<X size={13} />} onClick={() => setPreview(null)}>
              Cancelar
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Camera size={13} />}
              onClick={() => inputRef.current?.click()}
              disabled={procesando}
            >
              {procesando ? "Procesando…" : foto ? "Cambiar foto" : "Subir foto"}
            </Button>
            {foto && (
              <form action={onActualizar}>
                <input type="hidden" name="foto" value="" />
                <BotonConfirmado
                  confirmacion={{ titulo: "¿Quitar tu foto?", mensaje: "Vas a volver a mostrar tu inicial en lugar de la foto.", confirmar: "Quitar" }}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 size={13} aria-hidden /> Quitar
                </BotonConfirmado>
              </form>
            )}
          </div>
        )}
        <p className="text-[11px] text-lo">JPG, PNG o WebP. Se recorta cuadrada y se comprime.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handleArchivo}
      />
    </div>
  );
}
