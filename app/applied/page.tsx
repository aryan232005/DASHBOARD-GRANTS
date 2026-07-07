"use client";

import { useEffect, useState } from "react";
import GeminiAssistant from "@/components/GeminiAssistant";

type Application = {
  id: string;
  grantId: string;
  status: string;
  notes: string;
  submittedAt: string | null;
  updatedAt: string;
  grant: { title: string; organization: string; amount: number; currency: string; deadline: string } | null;
};

const statusStyles: Record<string, string> = {
  drafting: "bg-stroke/50 text-muted",
  submitted: "bg-blue-500/20 text-blue-300",
  in_review: "bg-yellow-500/20 text-yellow-300",
  awarded: "bg-green-500/20 text-green-300",
  rejected: "bg-red-500/20 text-red-300",
};

export default function AppliedPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applied")
      .then((r) => r.json())
      .then((d) => setApps(d.applications))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 pb-24">
      <section className="py-10 md:py-14">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-px bg-stroke" />
          <span className="text-xs text-muted uppercase tracking-[0.3em]">Your pipeline</span>
        </div>
        <h1 className="font-display italic text-4xl md:text-5xl">Applied grants</h1>
      </section>

      {loading ? (
        <div className="text-muted text-sm">Loading pipeline…</div>
      ) : apps.length === 0 ? (
        <div className="text-muted text-sm">
          No applications tracked yet. Head to{" "}
          <a href="/grants" className="underline">
            Global Grants
          </a>{" "}
          and click "Track it" on any grant.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {apps.map((a) => (
            <div
              key={a.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-[28px] bg-surface/30 hover:bg-surface border border-stroke transition-colors"
            >
              <div className="flex-1">
                <div className="text-xs text-muted uppercase tracking-[0.15em] mb-1">{a.grant?.organization}</div>
                <div className="font-display italic text-xl">{a.grant?.title ?? "Unknown grant"}</div>
                {a.notes && <div className="text-sm text-muted mt-1">{a.notes}</div>}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {a.grant && (
                  <span className="font-display italic text-lg">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: a.grant.currency, maximumFractionDigits: 0 }).format(a.grant.amount)}
                  </span>
                )}
                <span className={`text-xs px-3 py-1.5 rounded-full capitalize ${statusStyles[a.status] ?? "bg-stroke/50 text-muted"}`}>
                  {a.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <GeminiAssistant />
    </div>
  );
}
