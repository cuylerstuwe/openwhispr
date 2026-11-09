const fs = require("fs");
const path = require("path");

const MAX_BYTES = 4 * 1024 * 1024;
const allowedFile = (name) =>
  name === ".env" ||
  /^secure-keys\/(?:[A-Z][A-Z0-9_]*\.enc|\.migrated|master-key-backup\.enc)$/.test(name);
function preferences(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid preferences");
  const result = Object.create(null);
  for (const [key, entry] of Object.entries(value)) {
    if (key.length > 300 || typeof entry !== "string") throw new Error("Invalid preference entry");
    result[key] = entry;
  }
  if (Buffer.byteLength(JSON.stringify(result)) > MAX_BYTES)
    throw new Error("Preferences too large");
  return result;
}

// An encrypted, local configuration copy independent of Chromium's cache/profile.
// Credentials remain encrypted here and in the original secure-keys files.
class PersonalConfiguration {
  constructor({ profileDir, backupPath, encrypt, decrypt }) {
    this.profileDir = profileDir;
    this.backupPath = backupPath;
    this.encrypt = encrypt;
    this.decrypt = decrypt;
    this.values = null;
    this.disabled = false;
    this.lastGood = null;
    this.lastContent = null;
    for (const file of [backupPath, `${backupPath}.previous`]) {
      try {
        const raw = fs.readFileSync(file);
        const data = JSON.parse(decrypt(raw));
        if (data.version !== 1) throw new Error("Unknown configuration version");
        const restored = preferences(data.preferences);
        for (const [name, content] of Object.entries(data.files || {})) {
          if (!allowedFile(name) || typeof content !== "string" || content.length > MAX_BYTES)
            continue;
          const target = path.join(profileDir, name);
          if (fs.existsSync(target)) continue;
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(`${target}.restore`, Buffer.from(content, "base64"), { mode: 0o600 });
          fs.renameSync(`${target}.restore`, target);
        }
        this.values = restored;
        this.lastGood = raw;
        break;
      } catch (error) {
        if (error.code !== "ENOENT") this.recoveryError = true;
      }
    }
  }

  bootstrap(current) {
    if (this.disabled) return current;
    if (this.values === null) this.values = preferences(current);
    this.flush();
    return { ...this.values };
  }

  patch(change) {
    if (this.disabled || this.values === null || !change) return;
    if (change.type === "clear") this.values = Object.create(null);
    else if (change.type === "remove" && typeof change.key === "string")
      delete this.values[change.key];
    else if (
      change.type === "set" &&
      typeof change.key === "string" &&
      typeof change.value === "string"
    ) {
      const next = { ...this.values, [change.key]: change.value };
      this.values = preferences(next);
    }
  }

  captureFiles() {
    const names = [".env"];
    try {
      names.push(
        ...fs
          .readdirSync(path.join(this.profileDir, "secure-keys"))
          .map((name) => `secure-keys/${name}`)
      );
    } catch {}
    const files = Object.create(null);
    for (const name of names) {
      if (!allowedFile(name)) continue;
      try {
        const target = path.join(this.profileDir, name);
        const stat = fs.lstatSync(target);
        if (stat.isFile() && stat.size <= MAX_BYTES)
          files[name] = fs.readFileSync(target).toString("base64");
      } catch {}
    }
    return files;
  }

  flush() {
    if (this.disabled || this.values === null) return;
    const content = JSON.stringify({
      version: 1,
      preferences: this.values,
      files: this.captureFiles(),
    });
    if (content === this.lastContent) return;
    const encrypted = this.encrypt(content); // Fail closed: never fall back to plaintext.
    fs.mkdirSync(path.dirname(this.backupPath), { recursive: true });
    fs.writeFileSync(`${this.backupPath}.tmp`, encrypted, { mode: 0o600 });
    if (this.lastGood)
      fs.writeFileSync(`${this.backupPath}.previous`, this.lastGood, { mode: 0o600 });
    fs.renameSync(`${this.backupPath}.tmp`, this.backupPath);
    this.lastGood = encrypted;
    this.lastContent = content;
  }

  reset() {
    this.disabled = true;
    this.values = null;
    for (const suffix of ["", ".previous", ".tmp"])
      fs.rmSync(`${this.backupPath}${suffix}`, { force: true });
  }
}

let active = null;
function installPersonalConfiguration({ app, ipcMain, safeStorage, channel = "production" }) {
  if (active) return active;
  const profileDir = app.getPath("userData");
  const backupDir = process.env.WHISPR_PERSONAL_DATA_DIR
    ? path.join(profileDir, "personal-configuration")
    : path.join(
        app.getPath("appData"),
        channel === "production" ? "WhisprPersonal" : `WhisprPersonal-${channel}`
      );
  const encrypt = (content) => {
    if (!safeStorage.isEncryptionAvailable())
      throw new Error("OS configuration encryption unavailable");
    return safeStorage.encryptString(content);
  };
  active = new PersonalConfiguration({
    profileDir,
    backupPath: path.join(backupDir, "configuration.enc"),
    encrypt,
    decrypt: (buffer) => safeStorage.decryptString(buffer),
  });
  const warn = () =>
    console.warn(
      "[Personal configuration] Could not update the encrypted local configuration copy."
    );
  ipcMain.on("personal-configuration-bootstrap", (event, current) => {
    try {
      event.returnValue = active.bootstrap(current);
    } catch {
      warn();
      event.returnValue = current;
    }
  });
  let pending;
  const flush = () => {
    clearTimeout(pending);
    try {
      active.flush();
    } catch {
      warn();
    }
  };
  ipcMain.on("personal-configuration-patch", (_event, change) => {
    try {
      active.patch(change);
    } catch {
      warn();
      return;
    }
    clearTimeout(pending);
    pending = setTimeout(flush, 100);
  });
  // API-key and hotkey saves can happen without a renderer preference change.
  const timer = setInterval(flush, 5000);
  timer.unref();
  let watcher;
  try {
    watcher = fs.watch(profileDir, { recursive: true }, (_event, file) => {
      if (!file || !allowedFile(String(file).replace(/\\/g, "/"))) return;
      clearTimeout(pending);
      pending = setTimeout(flush, 100);
    });
    watcher.on("error", () => {}); // The periodic flush remains available.
  } catch {}
  app.on("will-quit", () => {
    clearInterval(timer);
    watcher?.close();
    flush();
  });
  return active;
}
function clearPersonalConfiguration() {
  active?.reset();
}
module.exports = {
  PersonalConfiguration,
  installPersonalConfiguration,
  clearPersonalConfiguration,
};
