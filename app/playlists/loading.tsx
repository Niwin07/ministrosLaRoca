export default function Loading() {
  return (
    <div className="flex flex-col gap-10 px-4 pt-8 pb-6">
      {/* Section header */}
      <section className="flex flex-col gap-4">
        <div className="h-3 w-24 animate-pulse rounded bg-glass-elevated" />

        {/* Create input skeleton */}
        <div className="animate-pulse flex gap-2">
          <div className="h-12 flex-1 rounded-xl bg-glass-base" />
          <div className="h-12 w-20 rounded-xl bg-purple-600/20" />
        </div>

        {/* Items */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-3 rounded-2xl border border-glass-elevated bg-glass-base px-4 py-3.5"
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-glass-elevated" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 rounded bg-glass-elevated" />
              <div className="h-2.5 w-1/4 rounded bg-glass-base" />
            </div>
            <div className="h-3.5 w-3.5 rounded bg-glass-base" />
          </div>
        ))}
      </section>

      {/* Ensayos section */}
      <section className="flex flex-col gap-4">
        <div className="h-3 w-36 animate-pulse rounded bg-glass-elevated" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-3 rounded-2xl border border-glass-elevated bg-glass-base px-4 py-3.5"
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-yellow-400/20" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded bg-glass-elevated" />
              <div className="h-2.5 w-1/3 rounded bg-glass-base" />
            </div>
            <div className="h-3.5 w-3.5 rounded bg-glass-base" />
          </div>
        ))}
      </section>
    </div>
  );
}
