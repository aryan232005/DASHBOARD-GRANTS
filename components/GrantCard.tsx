"use client";

type Grant = {
  id: string;
  title: string;
  organization: string;
  country: string;
  category: string;
  amount: number;
  currency: string;
  deadline: string;
  description: string;
  tags: string[];
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function GrantCard({ grant, onApply }: { grant: Grant; onApply?: (id: string) => void }) {
  const days = daysLeft(grant.deadline);
  const urgent = days <= 14;

  return (
    <div className="group relative bg-surface border border-stroke rounded-3xl p-6 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted uppercase tracking-[0.15em] mb-1">{grant.organization}</div>
          <h3 className="font-display italic text-xl md:text-2xl leading-tight">{grant.title}</h3>
        </div>
        <span className="shrink-0 text-xs px-3 py-1 rounded-full border border-stroke text-muted">{grant.country}</span>
      </div>

      <p className="text-sm text-muted line-clamp-2">{grant.description}</p>

      <div className="flex flex-wrap gap-2">
        {grant.tags.map((t) => (
          <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-stroke/50 text-muted">
            {t}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stroke mt-auto">
        <div>
          <div className="font-display italic text-2xl">{formatMoney(grant.amount, grant.currency)}</div>
          <div className={`text-xs mt-0.5 ${urgent ? "text-red-400" : "text-muted"}`}>
            {days} day{days === 1 ? "" : "s"} left to apply
          </div>
        </div>
        <button
          onClick={() => onApply?.(grant.id)}
          className="rounded-full text-sm px-5 py-2.5 bg-text-primary text-bg hover:scale-105 transition-transform"
        >
          Track it
        </button>
      </div>
    </div>
  );
}
