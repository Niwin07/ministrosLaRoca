"use client";

import { useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import { Button } from "@/components/Button";

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
  const inicial = nombre.charAt(0).toUpperCase();

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
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-violet-600">
          {mostrada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mostrada} alt="Foto de perfil" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-white">{inicial}</span>
          )}
        </div>
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
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-mid transition-colors hover:text-hi"
            >
              Cancelar
            </button>
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
                <button
                  type="submit"
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:text-red-600"
                >
                  Quitar
                </button>
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
