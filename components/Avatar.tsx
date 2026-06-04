interface AvatarProps {
  foto:       string | null;
  nombre:     string;
  /** Diámetro en px. */
  size?:      number;
  className?: string;
}

/**
 * Avatar reutilizable: muestra la foto de perfil si existe, o la inicial del
 * nombre sobre fondo violeta. Server-safe (sin estado), sirve en cualquier lista
 * que muestre personas (turnos, esta semana, admin, etc.).
 */
export function Avatar({ foto, nombre, size = 36, className = "" }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-600 ${className}`}
      style={{ width: size, height: size }}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold leading-none text-white" style={{ fontSize: Math.round(size * 0.4) }}>
          {nombre.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
