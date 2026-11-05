import type { StoreBilling, UsageState } from "../lib/usageStore";

export interface UseUsageResult {
  /** Entitlement is only known when this is `"success"`. Gate billing UI on it. */
  status: UsageState["status"];
  isRefreshing: boolean;
  isRetrying: boolean;
  error: string | null;
  retry: () => Promise<void>;
  refetch: () => Promise<void>;
  /** `null` while the entitlement is unknown — never assume free. */
  hasPaidAccess: boolean | null;
  /**
   * `hasPaidAccess` with the unknown case resolved in the account's favour, for
   * gates where locking out a payer costs more than briefly over-granting
   * (the server stays authoritative).
   */
  hasPaidAccessOptimistic: boolean;
  plan: string;
  isPastDue: boolean;
  wordsUsed: number;
  wordsRemaining: number;
  limit: number;
  isSubscribed: boolean;
  isPersonallySubscribed: boolean;
  /** Set when the plan was bought in the mobile app; manage it in the store, never through Stripe. */
  storeBilling: StoreBilling | null;
  entitledWorkspaceIds: string[];
  isTrial: boolean;
  trialDaysLeft: number | null;
  currentPeriodEnd: string | null;
  billingInterval: "monthly" | "annual" | null;
  isOverLimit: boolean;
  isApproachingLimit: boolean;
  resetAt: string | null;
  /** Any Stripe action — checkout, switch-plan or portal — is in flight; they share one guard. */
  checkoutLoading: boolean;
  openCheckout: (opts?: {
    plan?: "monthly" | "annual";
    tier?: "pro" | "business";
  }) => Promise<{ success: boolean; error?: string; code?: string }>;
  openBillingPortal: () => Promise<{ success: boolean; error?: string; code?: string }>;
  switchPlan: (opts: {
    plan: "monthly" | "annual";
    tier: "pro" | "business";
  }) => Promise<{ success: boolean; alreadyOnPlan?: boolean; error?: string; code?: string }>;
  previewSwitchPlan: (opts: { plan: "monthly" | "annual"; tier: "pro" | "business" }) => Promise<{
    success: boolean;
    immediateAmount?: number;
    currency?: string;
    currentPriceAmount?: number;
    currentInterval?: string;
    newPriceAmount?: number;
    newInterval?: string;
    nextBillingDate?: string;
    alreadyOnPlan?: boolean;
    error?: string;
    code?: string;
  }>;
}

// Standalone features have no company entitlement, quota, or polling loop.
const noop = async () => {};
const unavailable = async () => ({ success: false, code: "PERSONAL_EDITION" });
const personalUsage: UseUsageResult = {
  status: "success",
  isRefreshing: false,
  isRetrying: false,
  error: null,
  retry: noop,
  refetch: noop,
  hasPaidAccess: true,
  hasPaidAccessOptimistic: true,
  plan: "personal",
  isPastDue: false,
  wordsUsed: 0,
  wordsRemaining: Infinity,
  limit: 0,
  isSubscribed: false,
  isPersonallySubscribed: false,
  storeBilling: null,
  entitledWorkspaceIds: [],
  isTrial: false,
  trialDaysLeft: null,
  currentPeriodEnd: null,
  billingInterval: null,
  isOverLimit: false,
  isApproachingLimit: false,
  resetAt: null,
  checkoutLoading: false,
  openCheckout: unavailable,
  openBillingPortal: unavailable,
  switchPlan: unavailable,
  previewSwitchPlan: unavailable,
};
export function useUsage(): UseUsageResult {
  return personalUsage;
}
