// Runs before the settings store is evaluated. Preserve personal endpoints,
// credentials, history, and preferences; retire only company-service choices.
import { attachPersonalPersistence } from "./persistence.js";
export function initializePersonalPreferences(storage) {
  for (const key of [
    "telemetryEnabled",
    "cloudBackupEnabled",
    "insightsSyncEnabled",
    "autoUpdatesEnabled",
    "isSignedIn",
  ]) {
    storage.setItem(key, "false");
  }
  storage.setItem("authenticationSkipped", "true");
  storage.setItem("skipAuth", "true");
  storage.removeItem("signInPromptedAt");
  for (const prefix of ["", "meeting", "upload"]) {
    const mode = prefix ? `${prefix}TranscriptionMode` : "transcriptionMode";
    const cloudMode = prefix ? `${prefix}CloudTranscriptionMode` : "cloudTranscriptionMode";
    const provider = prefix ? `${prefix}CloudTranscriptionProvider` : "cloudTranscriptionProvider";
    if (!storage.getItem(mode) || storage.getItem(mode) === "openwhispr")
      storage.setItem(mode, "providers");
    storage.setItem(cloudMode, "byok");
    if (!storage.getItem(provider) || storage.getItem(provider) === "openwhispr")
      storage.setItem(provider, "custom");
  }
  for (const prefix of [
    "cleanup",
    "dictationAgent",
    "dictationAgentVision",
    "noteFormatting",
    "translation",
    "chatAgent",
  ]) {
    const key = `${prefix}Mode`;
    if (!storage.getItem(key) || storage.getItem(key) === "openwhispr") {
      storage.setItem(key, "providers");
      if (prefix === "cleanup") storage.setItem("useCleanupModel", "false");
    }
    storage.setItem(`${prefix}CloudMode`, "byok");
  }
  if (storage.getItem("dataRetentionEnabled") === null)
    storage.setItem("dataRetentionEnabled", "true");
  storage.setItem("personalEditionVersion", "1");
}

if (typeof window !== "undefined") {
  attachPersonalPersistence(window.localStorage, window.electronAPI);
  initializePersonalPreferences(window.localStorage);
}
