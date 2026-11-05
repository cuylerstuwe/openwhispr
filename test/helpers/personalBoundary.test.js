const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isCompanyUrl,
  companyChannel,
  installPersonalBoundary,
} = require("../../src/helpers/personalBoundary");

test("company domains are blocked without blocking personal inference servers", () => {
  for (const url of [
    "https://auth.openwhispr.com/api/auth/get-session",
    "https://api.openwhispr.com/api/analytics",
    "wss://api.openwhispr.com/live",
    "https://openwhispr.com./pricing",
  ])
    assert.equal(isCompanyUrl(url), true);
  for (const url of [
    "http://192.0.2.10:8080/v1",
    "https://whisper.example.test/asr/v1",
    "https://api.openai.com/v1",
    "https://huggingface.co/models",
    "https://openwhispr.com.example.net",
  ])
    assert.equal(isCompanyUrl(url), false);
  assert.equal(companyChannel("cloud-api-request"), true);
  assert.equal(companyChannel("auth-set-token"), true);
  assert.equal(companyChannel("save-custom-transcription-key"), false);
  assert.equal(companyChannel("analytics-get-summary"), false);
});

test("company IPC and all network paths are refused before dispatch", async (t) => {
  const http = require("node:http");
  const https = require("node:https");
  const originals = {
    fetch: global.fetch,
    httpRequest: http.request,
    httpGet: http.get,
    httpsRequest: https.request,
    httpsGet: https.get,
  };
  const handlers = new Map();
  let requestGuard;
  const ipcMain = { handle: (name, handler) => handlers.set(name, handler) };
  t.after(() => {
    global.fetch = originals.fetch;
    http.request = originals.httpRequest;
    http.get = originals.httpGet;
    https.request = originals.httpsRequest;
    https.get = originals.httpsGet;
  });
  installPersonalBoundary({
    app: { whenReady: () => Promise.resolve() },
    session: {
      defaultSession: {
        webRequest: {
          onBeforeRequest: (guard) => {
            requestGuard = guard;
          },
        },
      },
    },
    ipcMain,
  });
  await Promise.resolve();
  let dispatched = false;
  ipcMain.handle("cloud-api-request", () => {
    dispatched = true;
  });
  const denied = await handlers.get("cloud-api-request")();
  assert.equal(denied.code, "PERSONAL_EDITION");
  assert.equal(dispatched, false);
  ipcMain.handle("analytics-get-summary", () => ({ totalWords: 12 }));
  assert.equal(handlers.get("analytics-get-summary")().totalWords, 12);
  await assert.rejects(global.fetch("https://auth.openwhispr.com/"), /disabled/);
  assert.throws(() => https.request("https://api.openwhispr.com/"), /disabled/);
  assert.throws(() => http.get({ hostname: "api.openwhispr.com", path: "/upload" }), /disabled/);
  requestGuard({ url: "https://api.openwhispr.com/upload" }, (result) =>
    assert.equal(result.cancel, true)
  );
  requestGuard({ url: "http://192.0.2.10:8080/v1/audio/transcriptions" }, (result) =>
    assert.equal(result.cancel, false)
  );
});
