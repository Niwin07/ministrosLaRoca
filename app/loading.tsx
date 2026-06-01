export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-4">
      {/* Hero skeleton */}
      <div className="animate-pulse rounded-3xl border border-glass-elevated bg-glass-subtle p-6">
        <div className="h-4 w-32 rounded-lg bg-glass-elevated" />
        <div className="mt-4 h-8 w-48 rounded-xl bg-glass-elevated" />
        <div className="mt-2 h-4 w-40 rounded-lg bg-glass-base" />
        <div className="mt-6 flex gap-3">
          <div className="h-11 flex-1 rounded-2xl bg-glass-base" />
          <div className="h-11 flex-1 rounded-2xl bg-glass-base" />
        </div>
      </div>

      {/* List section skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-3 w-20 animate-pulse rounded bg-glass-elevated" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-3 rounded-2xl border border-glass-base bg-glass-subtle px-4 py-3"
          >
            <div className="h-9 w-9 shrink-0 rounded-xl bg-glass-elevated" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded bg-glass-elevated" />
              <div className="h-2.5 w-1/3 rounded bg-glass-base" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
