export function HeroBanner({
  badge,
  heading,
  subheading,
  tagline,
  scopeLabel,
}: {
  badge?: string;
  heading: string;
  subheading?: string;
  tagline?: string;
  scopeLabel?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink to-ink-2 px-6 py-8 text-white shadow-sm sm:px-8">
      {badge && (
        <span className="absolute right-5 top-5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
          {badge}
        </span>
      )}
      <h1 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">{heading}</h1>
      {subheading && <p className="mt-2 text-sm text-white/70">{subheading}</p>}
      {tagline && <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold">{tagline}</p>}
      {scopeLabel && (
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
          {scopeLabel}
        </span>
      )}
    </div>
  );
}
