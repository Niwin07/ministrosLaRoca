"use client";

import { useState } from "react";
import { Encabezado, BannerEdicion, Vacio, cls } from "@/components/zarza/ui";
import { BotonesEdicion } from "@/components/zarza/modulos/BotonesEdicion";
import { PasosChecklist, type Paso } from "@/components/zarza/modulos/PasosChecklist";
import { guardarPaso, eliminarPaso, moverPaso } from "@/app/actions/contenido";

export function ProtocoloVista({ pasos, puedeEditar }: { pasos: Paso[]; puedeEditar: boolean }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<null | "nuevo" | number>(null);

  return (
    <div className={`${cls.pagina} max-w-[760px]`}>
      <Encabezado
        volver={{ href: "/", label: "Inicio" }}
        icono="consola"
        titulo="Protocolo de sonido"
        sub="Seguí los pasos en orden antes de cada servicio"
        acciones={puedeEditar ? (
          <BotonesEdicion
            editando={editando}
            setEditando={(v) => { setEditando(v); setForm(null); }}
            agregarTxt="Agregar paso"
            onAgregar={() => setForm("nuevo")}
          />
        ) : undefined}
      />

      {editando && (
        <BannerEdicion>
          Agregá, editá o quitá pasos y cambiales el orden. Lo que cambies lo ven todos los sonidistas.
        </BannerEdicion>
      )}

      {pasos.length === 0 && !editando ? (
        <Vacio titulo="Todavía no hay pasos cargados">
          {puedeEditar ? "Tocá Editar para armar el protocolo de sonido." : "Cuando el equipo de liderazgo los cargue, los vas a ver acá."}
        </Vacio>
      ) : (
        <PasosChecklist
          pasos={pasos}
          rotulo="Paso"
          claveTildes="roca-protocolo-hechos"
          editando={editando}
          tono="vino"
          conVideo
          campos={{ titulo: "Qué hay que hacer", tituloPh: "Ej: Chequear micrófonos de voces", detalle: "Detalle (opcional)" }}
          formAbierto={form}
          setFormAbierto={setForm}
          guardar={guardarPaso}
          eliminar={eliminarPaso}
          mover={moverPaso}
        />
      )}
    </div>
  );
}
