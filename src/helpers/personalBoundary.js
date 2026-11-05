// Company features have no network or IPC path in the personal desktop build.
// The user's direct inference endpoints and public model downloads stay available.
const COMPANY_DOMAINS = ["openwhispr.com", "openwhispr.ai", "gizmolabs.ai", "gizmolabs.com"];

function isCompanyUrl(value) {
  try {
    const host = new URL(String(value)).hostname.toLowerCase().replace(/\.$/, "");
    return COMPANY_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

const unavailable = () => ({
  success: false,
  status: 0,
  code: "PERSONAL_EDITION",
  error: "Company services are not part of this personal build.",
});
function companyChannel(channel) {
  return (
    channel.startsWith("cloud-") ||
    channel.startsWith("auth-") ||
    [
      "get-workspace-policy",
      "get-stt-config",
      "get-note-recording-config",
      "oauth-sign-in",
      "oauth-sign-in-sso",
    ].includes(channel)
  );
}

function installPersonalBoundary({ app, session, ipcMain }) {
  const register = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = (channel, handler) =>
    register(
      channel,
      companyChannel(channel)
        ? async () => {
            if (channel === "auth-get-token") return null;
            if (channel === "auth-get-token-state")
              return { token: null, hasToken: false, generation: 0 };
            if (channel === "get-stt-config" || channel === "get-note-recording-config")
              return { success: true, providers: [], models: [] };
            return unavailable();
          }
        : handler
    );
  app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeRequest((details, callback) =>
      callback({ cancel: isCompanyUrl(details.url) })
    );
  });
  const originalFetch = globalThis.fetch;
  if (originalFetch)
    globalThis.fetch = (input, ...args) => {
      const url = typeof input === "string" || input instanceof URL ? input : input.url;
      return isCompanyUrl(url)
        ? Promise.reject(new Error("Company requests are disabled in the personal build."))
        : originalFetch(input, ...args);
    };
  // Node's HTTPS client and ws do not pass through Electron webRequest.
  for (const module of [require("http"), require("https")]) {
    for (const method of ["request", "get"]) {
      const original = module[method];
      module[method] = function (input, ...args) {
        const target =
          typeof input === "string" || input instanceof URL
            ? input
            : `https://${input.hostname || input.host || "localhost"}`;
        if (isCompanyUrl(target))
          throw new Error("Company requests are disabled in the personal build.");
        return original.call(this, input, ...args);
      };
    }
  }
}

module.exports = { isCompanyUrl, companyChannel, installPersonalBoundary };
