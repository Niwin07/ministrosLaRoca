// Banner de error reutilizable. Server component puro: se alimenta del
// searchParams.error que dejan las Server Actions al redirigir cuando fallan
// (patrón redirect→?error=→banner). Si no hay mensaje, no renderiza nada.
export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 animate-fade-in-down dark:text-amber-400">
      <span className="mt-0.5 shrink-0 font-bold">!</span>
      <span>{message}</span>
    </div>
  );
}
