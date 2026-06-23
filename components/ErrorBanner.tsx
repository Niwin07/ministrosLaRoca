"use client";

import { useEffect, useState } from "react";

export function ErrorBanner({ message }: { message?: string | null }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
    if (!message) return;
    const t = setTimeout(() => setDismissed(true), 5000);
    return () => clearTimeout(t);
  }, [message]);

  if (!message || dismissed) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 animate-fade-in-down dark:text-amber-400">
      <span className="mt-0.5 shrink-0 font-bold">!</span>
      <span>{message}</span>
    </div>
  );
}
