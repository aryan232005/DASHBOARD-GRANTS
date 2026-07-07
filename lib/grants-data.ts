export type Grant = {
  id: string;
  title: string;
  organization: string;
  country: string;
  category: string;
  amount: number;
  currency: string;
  deadline: string; // ISO date
  description: string;
  sourceUrl: string;
  tags: string[];
};

export type AppliedGrant = {
  id: string;
  grantId: string;
  status: "drafting" | "submitted" | "in_review" | "awarded" | "rejected";
  notes: string;
  submittedAt: string | null;
  updatedAt: string;
};

/**
 * In-memory fallback stores, used automatically only when DATABASE_URL is
 * not configured. Intentionally empty - SmalBlu ships with no sample/mock
 * grants. Add real grants either by:
 *   1. Connecting Postgres (set DATABASE_URL, run `npx prisma migrate dev`),
 *      then POST to /api/grants, or
 *   2. Pushing objects into `demoGrants` below if you want to test locally
 *      without a database.
 *
 * Note: this in-memory store resets on every server restart/redeploy - it's
 * meant for local trial only, never for real production data.
 */
export const demoGrants: Grant[] = [];

export const demoApplied: AppliedGrant[] = [];
