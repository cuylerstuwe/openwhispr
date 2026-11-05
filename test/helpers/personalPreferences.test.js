const test = require("node:test");
const assert = require("node:assert/strict");

test("personal migration keeps endpoints, model keys and local history preferences", async () => {
  const { initializePersonalPreferences } = await import("../../src/personal/initialize.js");
  const values = new Map(
    Object.entries({
      cloudTranscriptionBaseUrl: "http://192.0.2.10:8080/v1",
      cloudTranscriptionProvider: "custom",
      customTranscriptionApiKey: "private-key",
      transcriptionMode: "providers",
      dataRetentionEnabled: "false",
      cloudBackupEnabled: "true",
      insightsSyncEnabled: "true",
      autoUpdatesEnabled: "true",
    })
  );
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  initializePersonalPreferences(storage);
  assert.equal(values.get("cloudTranscriptionBaseUrl"), "http://192.0.2.10:8080/v1");
  assert.equal(values.get("customTranscriptionApiKey"), "private-key");
  assert.equal(values.get("dataRetentionEnabled"), "false");
  for (const key of [
    "cloudBackupEnabled",
    "insightsSyncEnabled",
    "autoUpdatesEnabled",
    "isSignedIn",
  ])
    assert.equal(values.get(key), "false");
  assert.equal(values.get("useCleanupModel"), "false");
  assert.equal(values.get("skipAuth"), "true");
});
