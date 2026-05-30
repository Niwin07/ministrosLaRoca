import type { ReactElement } from "react";

// Detecta etiquetas en corchetes ([VERSE 1]) o palabras clave de sección sueltas
const SECTION_LABEL_RE =
  /^(INTRO|VERSE|CHORUS|BRIDGE|OUTRO|PRE[- ]?CHORUS|TAG|INSTRUMENTAL|INTERLUDE|VAMP|HOOK|CODA|BREAKDOWN|SOLO|ENDING|REFRAIN)(\s+[\w().x]+)*$/i;

function isSectionLabel(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return true;
  return SECTION_LABEL_RE.test(trimmed);
}

interface ChartViewerProps {
  charts: string;
}

export function ChartViewer({ charts }: ChartViewerProps): ReactElement {
  const lines = charts.split("\n");

  return (
    <div className="overflow-x-auto">
      <div className="font-mono text-sm">
        {lines.map((line, index) => (
          <div
            key={index}
            className={
              isSectionLabel(line.trim())
                ? "whitespace-pre text-blue-500 font-bold mt-4"
                : "whitespace-pre"
            }
          >
            {line || " "}
          </div>
        ))}
      </div>
    </div>
  );
}
