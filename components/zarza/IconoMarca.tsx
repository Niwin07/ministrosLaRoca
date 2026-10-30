/* eslint-disable @next/next/no-img-element */

export type IconoMarcaNombre =
  | "inicio"
  | "servicios"
  | "repertorio"
  | "turnos"
  | "moderar"
  | "notif"
  | "luna"
  | "salir";

/**
 * Ícono ilustrado del sistema Zarza. Cada ícono tiene dos versiones
 * (claro/oscuro) y el CSS global muestra la que corresponde al tema
 * (.ico-claro / .ico-oscuro en globals.css), sin JS ni parpadeo.
 */
export function IconoMarca({
  nombre,
  size = 21,
  className = "",
}: {
  nombre: IconoMarcaNombre;
  size?: number;
  className?: string;
}) {
  const base = `block shrink-0 object-contain ${className}`;
  return (
    <>
      <img
        src={`/zarza/icons/${nombre}-claro.webp`}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={`ico-claro ${base}`}
        style={{ width: size, height: size }}
      />
      <img
        src={`/zarza/icons/${nombre}-oscuro.webp`}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={`ico-oscuro ${base}`}
        style={{ width: size, height: size }}
      />
    </>
  );
}
