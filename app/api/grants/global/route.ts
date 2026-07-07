import { NextRequest, NextResponse } from "next/server";

const SEARCH_URL = "https://api.grants.gov/v1/api/search2";
const DETAIL_URL = "https://api.grants.gov/v1/api/fetchOpportunity";

interface NormalizedGrant {
  id: string;
  title: string;
  organization: string;
  country: string;
  category: string;
  amount: number;
  currency: string;
  deadline: string;
  description: string;
  sourceUrl: string;
  tags: string[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") ?? "";

  try {
    const searchRes = await fetch(SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword,
        rows: 15,
        oppStatuses: "posted",
      }),
    });

    if (!searchRes.ok) {
      throw new Error(`search2 responded with ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    const hits = searchData?.data?.oppHits ?? [];

    // Keep hit + detail paired together, so we can use fields from BOTH
    // (the lean search result has the real closeDate; the detail call
    // has agency name, amount, description).
    const detailed = await Promise.all(
      hits.map(async (hit: any) => {
        try {
          const detailRes = await fetch(DETAIL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opportunityId: hit.id }),
          });
          const detailJson = await detailRes.json();
          return { hit, detail: detailJson?.data ?? null };
        } catch {
          return { hit, detail: null };
        }
      })
    );

    const normalized: NormalizedGrant[] = detailed
      .filter(({ detail }) => detail !== null)
      .map(({ hit, detail }: any) => {
        const synopsis = detail.synopsis ?? {};
        const rawAmount = synopsis.awardCeiling ?? synopsis.estimatedFunding ?? "0";

        return {
          id: `grantsgov-${detail.id}`,
          title: detail.opportunityTitle ?? "Untitled opportunity",
          organization: synopsis.agencyName ?? "Unknown agency",
          country: "United States",
          category: detail.opportunityCategory?.description ?? "General",
          amount: Number(String(rawAmount).replace(/[^0-9.]/g, "")) || 0,
          currency: "USD",
          // Real closing date lives on the original search hit, not the detail object
          deadline: hit.closeDate ?? "",
          description: synopsis.synopsisDesc ?? "",
          sourceUrl: `https://www.grants.gov/search-results-detail/${detail.id}`,
          tags: (synopsis.fundingInstruments ?? []).map((f: any) => f.description),
        };
      });

    return NextResponse.json({ grants: normalized, source: "grants.gov" });
  } catch (error) {
    console.error("Failed to fetch from Grants.gov:", error);
    return NextResponse.json(
      { error: "Failed to fetch external grants", grants: [] },
      { status: 502 }
    );
  }
}