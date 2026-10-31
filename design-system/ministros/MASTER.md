# Sistema visual "Zarza" — Ministros La Roca

> Fuente de verdad: canvas de diseño de Claude (artboards `SistemaVisual`, `MenuLateral`,
> `BarraSuperior`, `*Contenido`). El diseño anterior (violeta/zinc) quedó retirado.
> *Lo que Dios enciende, no se gasta.* (Éxodo 3:2-5)

## Dónde vive cada cosa

| Pieza | Archivo |
|------|---------|
| Tokens de color (claro / noche) | `app/globals.css` (`--base`, `--card`, `--input`, `--line`, `--mark`, `--hi`, `--mid`, `--lo`, `--gone`) |
| Escala de acento "Fuego" | `tailwind.config.ts` → `fuego-*` (alias `violet-*` por compatibilidad) |
| Gradiente "Llama" / sombras | `tailwind.config.ts` → `bg-llama`, `shadow-llama`, `shadow-card` |
| Fondos animados por sección | `app/zarza-fondos.css` (generado del canvas) + `components/zarza/FondoSeccion.tsx` |
| Íconos ilustrados (claro/oscuro) | `public/zarza/icons/*-{claro,oscuro}.webp` + `components/zarza/IconoMarca.tsx` |
| Logo (zarza ardiente) | `public/zarza/logo-zarza.webp` |
| Piezas de UI compartidas | `components/zarza/ui.tsx` (`cls`, `Encabezado`, `BannerEdicion`, `Vacio`, `Inicial`, `AvisoMigracion`) |

## Paleta

- **Fuego**: Ámbar `#E8A060` · Llama `#D9864A` · **Bermellón `#B4472A` (acento)** · Vino `#7A2A26` · Brasa `#4A1A10`
- **Base (claro)**: Crema `#F7EFE2` · Superficie `#FDF6ED` · Arena `#F3E7D6` · Borde `#EADBC6` · Tinta `#2B1611` · Texto 2 `#6E4C40`
- **Noche**: fondo `#1A0504`, superficies `#1B1311`, texto `#E5D8C7`, acento `#D65A32`
- **Funcionales (etapas)**: Preparación `#6E4C40/#F3E7D6` · En ensayo `#9A3C0A/#FFECCC` · Definitiva `#94402A/#FDE4D8` · Error `#DC2626`

## Tipografía

DM Sans (lectura) · Bricolage Grotesque (títulos, `font-display`) · Geist Mono (datos). Auto-hospedadas con `@fontsource`.

## Reglas

- Botón principal: `cls.btnLlama` (gradiente Llama, píldora). Secundario: `cls.btnSec`.
- Campos: píldora arena (`cls.campo`); textareas `rounded-2xl`.
- Tarjetas: superficie `bg-card`, borde `border-line`, radio 16–28 px, `shadow-card` (sin sombra en noche).
- Eyebrows en mayúsculas espaciadas; títulos de pantalla en Bricolage 26–30 px.
- Contraste AA mínimo: el bermellón se usa como texto sólo sobre crema/superficie (5:1).
- Sin `backdrop-filter` sobre el fondo animado (rendimiento): barras con color casi opaco.
