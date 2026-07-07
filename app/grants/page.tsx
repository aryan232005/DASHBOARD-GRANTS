"use client";

import { useEffect, useState } from "react";
import GrantCard from "@/components/GrantCard";
import GeminiAssistant from "@/components/GeminiAssistant";

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

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(false);
  const [ranked, setRanked] = useState<Record<string, { fitScore: number; reason: string }>>({});

 useEffect(() => {
    Promise.all([
      fetch("/api/grants").then((r) => r.json()),
      fetch("/api/grants/global").then((r) => r.json()),
    ])
      .then(([ownData, globalData]) => {
        const ownGrants = ownData.grants ?? [];
        const globalGrants = globalData.grants ?? [];
        setGrants([...ownGrants, ...globalGrants]);
      })
      .finally(() => setLoading(false));
  }, []);
  
  async function trackGrant(grantId: string) {
    await fetch("/api/applied", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantId, status: "drafting" }),
    });
    alert("Added to your applied grants pipeline.");
  }

  async function rankWithGemini() {
    setRanking(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rank", profile: "SmalBlu — early-stage AI SaaS startup focused on applied ML tooling." }),
      });
      const data = await res.json();
      const map: Record<string, { fitScore: number; reason: string }> = {};
      (data.ranked ?? []).forEach((r: any) => (map[r.id] = r));
      setRanked(map);
    } finally {
      setRanking(false);
    }
  }

  const sorted = [...grants].sort((a, b) => (ranked[b.id]?.fitScore ?? 0) - (ranked[a.id]?.fitScore ?? 0));

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 pb-24">
      <section className="py-10 md:py-14">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-px bg-stroke" />
          <span className="text-xs text-muted uppercase tracking-[0.3em]">Live from around the world</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h1 className="font-display italic text-4xl md:text-5xl">Global grant explorer</h1>
          <button
            onClick={rankWithGemini}
            disabled={ranking}
            className="relative group rounded-full w-fit"
          >
            <span className="absolute -inset-[2px] rounded-full accent-gradient opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-2 bg-bg text-text-primary rounded-full px-6 py-3 text-sm">
              {ranking ? "Gemini is ranking…" : "Rank best fit with Gemini"}
            </span>
          </button>
        </div>
      </section>

      {loading ? (
        <div className="text-muted text-sm">Loading grants…</div>
      ) : sorted.length === 0 ? (
        <div className="bg-surface border border-stroke rounded-3xl p-10 text-center">
          <p className="text-muted text-sm mb-2">No grants in the system yet.</p>
          <p className="text-muted text-sm">
            Connect Postgres (see README) and add real grants via <code className="text-text-primary">POST /api/grants</code>,
            or wire up a scraper/feed to populate them automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {sorted.map((g) => (
            <div key={g.id} className="relative">
              {ranked[g.id] && (
                <div className="absolute -top-3 left-6 z-10 text-[11px] px-3 py-1 rounded-full accent-gradient text-white">
                  {ranked[g.id].fitScore}% fit · {ranked[g.id].reason}
                </div>
              )}
              <GrantCard grant={g} onApply={trackGrant} />
            </div>
          ))}
        </div>
      )}

      <GeminiAssistant />
    </div>
  );
}
