"use client";

import { useState } from "react";
import { Encabezado, BannerEdicion, Vacio, cls } from "@/components/zarza/ui";
import { BotonesEdicion } from "@/components/zarza/modulos/BotonesEdicion";
import { VideosGrilla, type Video } from "@/components/zarza/modulos/VideosGrilla";
import type { IconoMarcaNombre } from "@/components/zarza/IconoMarca";
import { guardarVideoMejorar, eliminarVideoMejorar, moverVideoMejorar } from "@/app/actions/contenido";

export function CategoriaVista({
  categoria,
  videos,
  puedeEditar,
}: {
  categoria: { id: number; nombre: string; icono: string };
  videos: Video[];
  puedeEditar: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<null | "nuevo" | number>(null);

  return (
    <div className={`${cls.pagina} max-w-[1040px]`}>
      <Encabezado
        volver={{ href: "/mejorar", label: "Quiero mejorar" }}
        icono={categoria.icono as IconoMarcaNombre}
        titulo={categoria.nombre}
        sub={`${videos.length} ${videos.length === 1 ? "video" : "videos"}`}
        acciones={puedeEditar ? (
          <BotonesEdicion
            editando={editando}
            setEditando={(v) => { setEditando(v); setForm(null); }}
            agregarTxt="Agregar video"
            onAgregar={() => setForm("nuevo")}
          />
        ) : undefined}
      />

      {editando && (
        <BannerEdicion>
          Estos son los videos que ve el equipo al entrar a {categoria.nombre}. Agregá, editá, quitá o cambiá el orden.
        </BannerEdicion>
      )}

      {videos.length === 0 && !editando ? (
        <Vacio titulo="Todavía no hay videos en esta categoría">
          {puedeEditar ? "Tocá Editar para sumar videos de YouTube." : "Cuando se carguen, los vas a ver acá."}
        </Vacio>
      ) : (
        <VideosGrilla
          videos={videos}
          editando={editando}
          variante="ficha"
          formAbierto={form}
          setFormAbierto={setForm}
          guardar={guardarVideoMejorar}
          eliminar={eliminarVideoMejorar}
          mover={moverVideoMejorar}
          extra={{ id_categoria: categoria.id }}
          textoForm={{ titulo: `Nuevo video en ${categoria.nombre}`, nota: "La miniatura, el título y el canal se toman del link." }}
        />
      )}
    </div>
  );
}
