"use client";

import { useState } from "react";
import { Encabezado, BannerEdicion, Vacio, cls } from "@/components/zarza/ui";
import { BotonesEdicion, Segmentado } from "@/components/zarza/modulos/BotonesEdicion";
import { PasosChecklist, type Paso } from "@/components/zarza/modulos/PasosChecklist";
import { VideosGrilla, type Video } from "@/components/zarza/modulos/VideosGrilla";
import {
  guardarEjercicio, eliminarEjercicio, moverEjercicio,
  guardarVideoCalentamiento, eliminarVideoCalentamiento, moverVideoCalentamiento,
} from "@/app/actions/contenido";

type Pestana = "protocolo" | "videos";

export function CalentamientoVista({
  ejercicios,
  videos,
  puedeEditar,
}: {
  ejercicios: Paso[];
  videos: Video[];
  puedeEditar: boolean;
}) {
  const [tab, setTab] = useState<Pestana>("protocolo");
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<null | "nuevo" | number>(null);
  const enProtocolo = tab === "protocolo";

  return (
    <div className={`${cls.pagina} max-w-[1040px]`}>
      <Encabezado
        volver={{ href: "/", label: "Inicio" }}
        icono="voz"
        titulo="Calentamiento de voces"
        sub="Hacé estos ejercicios antes de cantar"
        acciones={puedeEditar ? (
          <BotonesEdicion
            editando={editando}
            setEditando={(v) => { setEditando(v); setForm(null); }}
            agregarTxt={enProtocolo ? "Agregar ejercicio" : "Agregar video"}
            onAgregar={() => setForm("nuevo")}
          />
        ) : undefined}
      />

      {editando && (
        <BannerEdicion>
          {enProtocolo
            ? "Agregá, editá o quitá ejercicios del protocolo y cambiales el orden."
            : "Agregá, editá o quitá los videos de ejercicios."}{" "}
          Lo que cambies lo ve todo el equipo.
        </BannerEdicion>
      )}

      <Segmentado
        label="Sección de calentamiento"
        valor={tab}
        onChange={(v) => { setTab(v); setForm(null); }}
        opciones={[{ valor: "protocolo", texto: "Protocolo" }, { valor: "videos", texto: "Ejercicios en video" }]}
      />

      {enProtocolo ? (
        ejercicios.length === 0 && !editando ? (
          <Vacio titulo="Todavía no hay ejercicios cargados">
            {puedeEditar ? "Tocá Editar para armar el protocolo de calentamiento." : "Cuando el equipo de liderazgo los cargue, los vas a ver acá."}
          </Vacio>
        ) : (
          <PasosChecklist
            pasos={ejercicios}
            rotulo="Ejercicio"
            claveTildes="roca-calentamiento-hechos"
            editando={editando}
            tono="llama"
            campos={{ titulo: "Nombre del ejercicio", tituloPh: "Ej: Lip trill", detalle: "Cómo se hace", detallePh: "Explicación breve" }}
            formAbierto={form}
            setFormAbierto={setForm}
            guardar={guardarEjercicio}
            eliminar={eliminarEjercicio}
            mover={moverEjercicio}
          />
        )
      ) : videos.length === 0 && !editando ? (
        <Vacio titulo="Todavía no hay videos de calentamiento">
          {puedeEditar ? "Tocá Editar para sumar videos de YouTube." : "Cuando se carguen, los vas a ver acá."}
        </Vacio>
      ) : (
        <VideosGrilla
          videos={videos}
          editando={editando}
          variante="cuadro"
          formAbierto={form}
          setFormAbierto={setForm}
          guardar={guardarVideoCalentamiento}
          eliminar={eliminarVideoCalentamiento}
          mover={moverVideoCalentamiento}
          textoForm={{ titulo: "Nuevo video de calentamiento", nota: "La miniatura y el título se toman del link." }}
        />
      )}
    </div>
  );
}
