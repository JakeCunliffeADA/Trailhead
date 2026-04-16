import type { GearSuggestion } from "@/server/suggestions";

type Props = { suggestions: GearSuggestion[] };

const severityStyles: Record<GearSuggestion["severity"], string> = {
  warn: "border-l-4 border-destructive bg-destructive/5",
  good: "border-l-4 border-green-500 bg-green-500/5",
  info: "border-l-4 border-blue-500 bg-blue-500/5",
};

const severityLabel: Record<GearSuggestion["severity"], string> = {
  warn: "Warning",
  good: "Good match",
  info: "Consider adding",
};

export function PackingSuggestions({ suggestions }: Props) {
  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No suggestions — add rated or tagged gear to your inventory to get personalised advice.
      </p>
    );
  }

  const warnings = suggestions.filter((s) => s.severity === "warn");
  const good = suggestions.filter((s) => s.severity === "good");
  const info = suggestions.filter((s) => s.severity === "info");

  const ordered = [...warnings, ...good, ...info];

  return (
    <ul className="grid gap-2">
      {ordered.map((s) => (
        <li key={s.gearItemId} className={`rounded-lg p-3 ${severityStyles[s.severity]}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {severityLabel[s.severity]}
          </p>
          <p className="text-sm font-medium">
            {s.brand ? `${s.brand} ` : ""}
            {s.name}
          </p>
          <p className="text-xs text-muted-foreground">{s.reason}</p>
        </li>
      ))}
    </ul>
  );
}
