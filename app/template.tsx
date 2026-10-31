/**
 * Se vuelve a montar en cada navegación: envuelve la pantalla para que sus
 * bloques entren en cascada (ver .entrada-pagina en zarza-movimiento.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="entrada-pagina">{children}</div>;
}
