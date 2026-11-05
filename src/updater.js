const { app } = require("electron");
// Personal builds have no upstream update feed, download, or install path.
class UpdateManager {
  constructor() {
    this.isQuittingForUpdate = false;
  }
  setWindowManager() {}
  checkForUpdatesOnStartup() {}
  checkForUpdates() {
    return Promise.resolve(this.getUpdateStatus());
  }
  downloadUpdate() {
    return Promise.resolve({ success: false, error: "Rebuild this personal edition locally." });
  }
  installUpdate() {
    return this.downloadUpdate();
  }
  getAppVersion() {
    return { version: app.getVersion() };
  }
  getUpdateInfo() {
    return null;
  }
  getUpdateStatus() {
    return {
      isSupported: false,
      isDevelopment: false,
      updateAvailable: false,
      updateDownloaded: false,
      isPersonalEdition: true,
    };
  }
  hasStagedUpdate() {
    return false;
  }
  deferInstallOnQuit() {}
  setAutoUpdatesEnabled() {}
  cleanup() {}
}
module.exports = UpdateManager;
