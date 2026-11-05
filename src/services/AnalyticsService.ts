import type { AnalyticsSummary } from "../types/electron";

export const ANALYTICS_SUMMARY_REFRESH_INTERVAL_MS = 300000;
export const ANALYTICS_REMOTE_REFRESH_DEBOUNCE_MS = 250;
export function subscribeToAnalyticsRefresh(
  refresh: () => void | Promise<void>,
  _cloud = false
): () => void {
  const update = () => void refresh();
  const dispose = window.electronAPI.onAnalyticsChanged?.(update);
  update();
  return () => dispose?.();
}
export function syncPendingAnalytics(_options: unknown = {}): Promise<number> {
  return Promise.resolve(0);
}
export async function getAccountAnalyticsSummary(
  _account?: string | null
): Promise<AnalyticsSummary> {
  return window.electronAPI.getAnalyticsSummary();
}
