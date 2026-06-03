export default function Loading() {
  return (
    <div className="flex flex-col gap-10 px-4 pt-8 pb-6">
      {/* Section header */}
      <section className="flex flex-col gap-4">
        <div className="h-3 w-24 animate-pulse rounded bg-mark" />

        {/* Create input skeleton */}
        <div className="animate-pulse flex gap-2">
          <div className="h-12 flex-1 rounded-xl bg-input" />
          <div className="h-12 w-20 rounded-xl bg-violet-600/20" />
        </div>

        {/* Items */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 shadow-card dark:shadow-none"
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-mark" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 rounded bg-mark" />
              <div className="h-2.5 w-1/4 rounded bg-input" />
            </div>
            <div className="h-3.5 w-3.5 rounded bg-input" />
          </div>
        ))}
      </section>

      {/* Ensayos section */}
      <section className="flex flex-col gap-4">
        <div className="h-3 w-36 animate-pulse rounded bg-mark" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 shadow-card dark:shadow-none"
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-yellow-400/30" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded bg-mark" />
              <div className="h-2.5 w-1/3 rounded bg-input" />
            </div>
            <div className="h-3.5 w-3.5 rounded bg-input" />
          </div>
        ))}
      </section>
    </div>
  );
}
