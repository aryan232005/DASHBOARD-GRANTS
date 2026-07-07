type Stat = { label: string; value: string };

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface border border-stroke rounded-3xl px-6 py-8 text-center">
          <div className="font-display italic text-4xl md:text-5xl accent-gradient-text mb-2">{s.value}</div>
          <div className="text-xs text-muted uppercase tracking-[0.2em]">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
