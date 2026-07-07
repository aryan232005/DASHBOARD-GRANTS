import StatsBar from "@/components/StatsBar";
import GeminiAssistant from "@/components/GeminiAssistant";
import { demoGrants, demoApplied } from "@/lib/grants-data";
import { hasDatabase, prisma } from "@/lib/db";
import Link from "next/link";

async function getData() {
  if (hasDatabase && prisma) {
    const [grants, applied] = await Promise.all([
      prisma.grant.findMany({ orderBy: { deadline: "asc" }, take: 4 }),
      prisma.appliedGrant.findMany({ include: { grant: true } }),
    ]);
    return { grants, applied };
  }
  return {
    grants: demoGrants.slice(0, 4),
    applied: demoApplied.map((a) => ({ ...a, grant: demoGrants.find((g) => g.id === a.grantId) })),
  };
}

export default async function Home() {
  const { grants, applied } = await getData();
  const totalTracked = applied.length;
  const submitted = applied.filter((a: any) => a.status !== "drafting").length;
  const totalPotential = applied.reduce((sum: number, a: any) => sum + (a.grant?.amount ?? 0), 0);
  const hasGrants = grants.length > 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 pb-24">
      {/* Hero */}
      <section className="py-12 md:py-16">
        <div className="text-xs text-muted uppercase tracking-[0.3em] mb-6">SmalBlu · Global Grant Intelligence</div>
        <h1 className="font-display italic text-5xl md:text-7xl leading-[0.95] tracking-tight mb-6 max-w-3xl">
          Every grant on earth, <span className="accent-gradient-text">tracked for you</span>.
        </h1>
        <p className="text-sm md:text-base text-muted max-w-lg mb-10">
          SmalBlu scans grant programs worldwide and uses Gemini to match, summarize, and help you apply —
          so your team never misses a deadline.
        </p>
        <div className="inline-flex gap-4">
          <Link href="/grants" className="rounded-full text-sm px-7 py-3.5 bg-text-primary text-bg hover:scale-105 transition-transform">
            Browse global grants
          </Link>
          <Link href="/applied" className="rounded-full text-sm px-7 py-3.5 border-2 border-stroke hover:scale-105 transition-transform">
            View pipeline
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-16">
        <StatsBar
          stats={[
            { label: "Grants tracked", value: String(totalTracked) },
            { label: "Applications submitted", value: String(submitted) },
            { label: "Potential funding", value: `$${Math.round(totalPotential / 1000)}k` },
          ]}
        />
      </section>

      {/* Featured grants */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-stroke" />
              <span className="text-xs text-muted uppercase tracking-[0.3em]">Closing soon</span>
            </div>
            <h2 className="font-display italic text-3xl md:text-4xl">Grants worth a look</h2>
          </div>
          <Link href="/grants" className="hidden md:inline-flex text-sm text-muted hover:text-text-primary items-center gap-1">
            View all grants <span>↗</span>
          </Link>
        </div>

        {hasGrants ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {grants.map((g: any) => (
              <div key={g.id} className="bg-surface border border-stroke rounded-3xl p-6">
                <div className="text-xs text-muted uppercase tracking-[0.15em] mb-1">{g.organization}</div>
                <h3 className="font-display italic text-xl mb-2">{g.title}</h3>
                <p className="text-sm text-muted line-clamp-2 mb-4">{g.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-display italic text-lg">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: g.currency, maximumFractionDigits: 0 }).format(g.amount)}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border border-stroke text-muted">{g.country}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface border border-stroke rounded-3xl p-10 text-center">
            <p className="text-muted text-sm mb-4">
              No grants added yet. Connect Postgres and add real grants, or POST to{" "}
              <code className="text-text-primary">/api/grants</code> to get started.
            </p>
            <Link href="/grants" className="text-sm underline">
              Go to Global Grants
            </Link>
          </div>
        )}
      </section>

      <GeminiAssistant />
    </div>
  );
}
