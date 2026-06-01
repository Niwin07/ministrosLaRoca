export function LyricViewer({ letra }: { letra: string }) {
  return (
    <div className="space-y-0.5 text-sm leading-7">
      {letra.split("\n").map((line, i) => {
        const trimmed = line.trim();
        const isSection = trimmed.startsWith("[") && trimmed.endsWith("]");
        if (!trimmed) return <div key={i} className="h-3" />;
        return (
          <div
            key={i}
            className={
              isSection
                ? "mt-4 text-[10px] font-bold uppercase tracking-widest text-blue-500"
                : "text-content-primary"
            }
          >
            {trimmed}
          </div>
        );
      })}
    </div>
  );
}
