// All notes, transcripts, dictionary entries, and Insights belong to this PC.
// There is no company sync client, scheduler, token exchange, or upload queue.
export type DictionarySyncResult = "synced" | "skipped" | "failed";
export async function markSpacePurged(..._args: unknown[]): Promise<void> {}
export async function releasePurgedSpace(..._args: unknown[]): Promise<void> {}
export async function upsertCloudSpaces(..._args: unknown[]): Promise<number[]> {
  return [];
}
export class SyncService {
  canSync(): boolean {
    return false;
  }
  startAutoSync() {}
  stopAutoSync() {}
  debouncedPush(..._args: unknown[]) {}
  requestSyncAll(..._args: unknown[]) {}
  setNoteOpen(..._args: unknown[]) {}
  async ensureNoteSynced(..._args: unknown[]): Promise<null> {
    return null;
  }
  async purgeTeamSpacesForSignOut(..._args: unknown[]) {}
  async syncDictionaryNow(): Promise<DictionarySyncResult> {
    return "skipped";
  }
  async syncSharedDictionaryNow(): Promise<DictionarySyncResult> {
    return "skipped";
  }
}
export const syncService = new SyncService();
