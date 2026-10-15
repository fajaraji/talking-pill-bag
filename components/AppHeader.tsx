import { ChevronRightIcon } from "./icons";

// Shared page header: optional back button (min 48x48 with visible label),
// title and optional subtitle, with the same spacing on every page.
export function AppHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back?: { label: string; onClick: () => void };
}) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex min-h-12 items-center gap-2">
        {back ? (
          <button
            type="button"
            onClick={back.onClick}
            aria-label={back.label}
            className="flex min-h-12 shrink-0 items-center gap-1 rounded-xl px-2 text-base font-semibold text-primary hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ChevronRightIcon className="h-6 w-6 rotate-180" />
            <span>{back.label}</span>
          </button>
        ) : null}
        <h1 className="text-xl font-bold text-ink">{title}</h1>
      </div>
      {subtitle ? <p className="text-base text-muted">{subtitle}</p> : null}
    </header>
  );
}
