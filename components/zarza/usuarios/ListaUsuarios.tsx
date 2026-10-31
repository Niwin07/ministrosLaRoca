"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ROL_LABEL } from "@/lib/roles";

interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
  foto: string | null;
  plataformas: string[];
}

// Colores de rol del diseño "Usuarios" (Admin = acento, Líder = ámbar, Ministro = arena).
const ROL_CHIP: Record<string, string> = {
  ADMINISTRADOR: "border-fuego-600/20 bg-fuego-600/15 text-[#94402a] dark:text-[#df8067]",
  LIDER:         "border-[#f8c49a] bg-[#fde4cc] text-[#9a3c0a] dark:border-[#3c2e1b] dark:bg-[#261b11] dark:text-[#f8894f]",
  MINISTRO:      "border-line bg-input text-mid",
};

/**
 * Lista de usuarios con filtros en chips (diseño "Usuarios"). Filtra por rol
 * y por plataforma, que existen en la base. El filtro por "áreas en las que
 * sirve" del diseño queda pendiente: requiere guardar esas áreas por usuario.
 */
export function ListaUsuarios({ usuarios }: { usuarios: Usuario[] }) {
  const plataformas = useMemo(
    () => Array.from(new Set(usuarios.flatMap((u) => u.plataformas))).sort((a, b) => (a === "General" ? -1 : b === "General" ? 1 : a.localeCompare(b))),
    [usuarios],
  );
  const filtros = [
    { id: "todos", label: "Todos" },
    { id: "rol:ADMINISTRADOR", label: "Administradores" },
    { id: "rol:LIDER", label: "Líderes" },
    { id: "rol:MINISTRO", label: "Ministros" },
    ...plataformas.map((p) => ({ id: `pla:${p}`, label: p })),
  ];
  const [filtro, setFiltro] = useState("todos");

  const visibles = usuarios.filter((u) => {
    if (filtro === "todos") return true;
    const [tipo, valor] = filtro.split(/:(.*)/);
    return tipo === "rol" ? u.rol === valor : u.plataformas.includes(valor);
  });

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2 text-[#c7613a]">
        <Users size={14} aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-hi">Usuarios registrados ({usuarios.length})</h2>
      </div>

      <div role="group" aria-label="Filtrar usuarios" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 no-scrollbar md:mx-0 md:px-0">
        {filtros.map((f) => {
          const on = f.id === filtro;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFiltro(f.id)}
              className={`min-h-[34px] shrink-0 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors ${
                on ? "border-fuego-600 bg-fuego-600 text-[#fcf5eb]" : "border-mark bg-[#fcf5eb] text-mid hover:text-hi dark:bg-card"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-mark px-5 py-6 text-center text-sm text-lo">Nadie coincide con este filtro.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {visibles.map((u) => (
            <div key={u.id_usuario} className="flex min-w-0 items-start gap-2.5 rounded-2xl border border-line bg-card p-4 shadow-card dark:shadow-none">
              <Avatar foto={u.foto} nombre={u.nombre} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-hi">{u.nombre}</p>
                <p className="mt-0.5 truncate text-xs text-lo">{u.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className={`rounded-full border px-2 py-px text-[11px] font-semibold ${ROL_CHIP[u.rol] ?? ROL_CHIP.MINISTRO}`}>
                    {ROL_LABEL[u.rol] ?? u.rol}
                  </span>
                  {u.plataformas.map((p) => (
                    <span key={p} className="rounded-full bg-[#f6ecdd] px-2 py-px text-[11px] font-medium text-[#4a2c22] dark:bg-input dark:text-mid">{p}</span>
                  ))}
                </div>
              </div>
              <Link href={`/admin/usuarios/${u.id_usuario}`} aria-label={`Editar ${u.nombre}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lo transition-colors hover:bg-fuego-600/10 hover:text-hi">
                <Pencil size={15} aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
