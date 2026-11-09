const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { PersonalConfiguration } = require("../../src/helpers/personalConfiguration");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "personal-configuration-"));
  const profileDir = path.join(root, "profile");
  const backupPath = path.join(root, "independent", "configuration.enc");
  fs.mkdirSync(profileDir);
  const key = crypto.randomBytes(32);
  const encrypt = (value) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const content = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), content]);
  };
  const decrypt = (buffer) => {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, buffer.subarray(0, 12));
    decipher.setAuthTag(buffer.subarray(12, 28));
    return Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString("utf8");
  };
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const options = { profileDir, backupPath, encrypt, decrypt };
  return { ...options, create: () => new PersonalConfiguration(options) };
}

test("a cleared browser profile recovers preferences and encrypted key files without storing plaintext", (t) => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.profileDir, "secure-keys"));
  fs.writeFileSync(path.join(f.profileDir, ".env"), "DICTATION_KEY=Control+F2\n");
  fs.writeFileSync(
    path.join(f.profileDir, "secure-keys", "CUSTOM_TRANSCRIPTION_API_KEY.enc"),
    Buffer.from([1, 2, 3, 4])
  );
  const saved = {
    cloudTranscriptionBaseUrl: "https://whisper.example.test/v1",
    cloudTranscriptionModel: "whisper-1",
    onboardingCompleted: "true",
  };
  f.create().bootstrap(saved);
  assert.equal(
    fs.readFileSync(f.backupPath).includes(Buffer.from(saved.cloudTranscriptionBaseUrl)),
    false
  );
  fs.rmSync(f.profileDir, { recursive: true });
  fs.mkdirSync(f.profileDir);
  const restored = f.create().bootstrap({});
  assert.deepEqual(restored, saved);
  assert.equal(
    fs.readFileSync(path.join(f.profileDir, ".env"), "utf8"),
    "DICTATION_KEY=Control+F2\n"
  );
  assert.deepEqual(
    fs.readFileSync(path.join(f.profileDir, "secure-keys", "CUSTOM_TRANSCRIPTION_API_KEY.enc")),
    Buffer.from([1, 2, 3, 4])
  );
});

test("saved configuration wins over defaults and individual changes survive a restart", (t) => {
  const f = fixture(t);
  const first = f.create();
  first.bootstrap({ dictationKey: "Control+F2", cleanupMode: "local", useCleanupModel: "true" });
  first.patch({ type: "set", key: "dictationKey", value: "Alt+F3" });
  first.patch({ type: "remove", key: "cleanupMode" });
  first.flush();
  assert.deepEqual(
    f.create().bootstrap({ dictationKey: "Control+Space", cleanupMode: "providers" }),
    { dictationKey: "Alt+F3", useCleanupModel: "true" }
  );
});

test("existing native settings are preserved and intentional key removal remains removed", (t) => {
  const f = fixture(t);
  const env = path.join(f.profileDir, ".env");
  fs.writeFileSync(env, "DICTATION_KEY=Control+F2\n");
  f.create().bootstrap({});
  fs.writeFileSync(env, "DICTATION_KEY=Alt+F3\n");
  const second = f.create();
  assert.equal(fs.readFileSync(env, "utf8"), "DICTATION_KEY=Alt+F3\n");
  fs.rmSync(env);
  second.flush();
  f.create();
  assert.equal(fs.existsSync(env), false);
});

test("a damaged primary copy falls back to the previous encrypted copy", (t) => {
  const f = fixture(t);
  const first = f.create();
  first.bootstrap({ dictationKey: "Control+F2" });
  first.patch({ type: "set", key: "dictationKey", value: "Alt+F3" });
  first.flush();
  fs.writeFileSync(f.backupPath, "damaged");
  assert.equal(f.create().bootstrap({}).dictationKey, "Control+F2");
});

test("an explicit reset erases recovery copies and cannot be undone by pending writes", (t) => {
  const f = fixture(t);
  const first = f.create();
  first.bootstrap({ dictationKey: "Control+F2" });
  first.reset();
  first.patch({ type: "set", key: "dictationKey", value: "Alt+F3" });
  first.flush();
  assert.equal(fs.existsSync(f.backupPath), false);
  assert.equal(fs.existsSync(`${f.backupPath}.previous`), false);
  assert.deepEqual(f.create().bootstrap({}), {});
});

test("an unavailable encryption backend leaves the previous encrypted copy untouched", (t) => {
  const f = fixture(t);
  f.create().bootstrap({ dictationKey: "Control+F2" });
  const previous = fs.readFileSync(f.backupPath);
  const broken = new PersonalConfiguration({
    ...f,
    encrypt: () => {
      throw new Error("unavailable");
    },
  });
  assert.throws(() => broken.bootstrap({}), /unavailable/);
  assert.deepEqual(fs.readFileSync(f.backupPath), previous);
});

test("renderer preferences restore before use and sessionStorage is never mirrored", async (t) => {
  const { attachPersonalPersistence } = await import("../../src/personal/persistence.js");
  class Storage {
    constructor(values = {}) {
      this.values = new Map(Object.entries(values));
    }
    get length() {
      return this.values.size;
    }
    key(index) {
      return [...this.values.keys()][index];
    }
    getItem(key) {
      return this.values.get(String(key)) ?? null;
    }
    setItem(key, value) {
      this.values.set(String(key), String(value));
    }
    removeItem(key) {
      this.values.delete(String(key));
    }
    clear() {
      this.values.clear();
    }
  }
  const originals = Object.fromEntries(
    ["setItem", "removeItem", "clear"].map((key) => [key, Storage.prototype[key]])
  );
  t.after(() => Object.assign(Storage.prototype, originals));
  const local = new Storage({ dictationKey: "Control+Space" });
  const session = new Storage();
  const patches = [];
  attachPersonalPersistence(local, {
    bootstrapPersonalConfiguration: () => ({ dictationKey: "Control+F2" }),
    patchPersonalConfiguration: (change) => patches.push(change),
  });
  assert.equal(local.getItem("dictationKey"), "Control+F2");
  local.setItem("dictationKey", "Alt+F3");
  local.removeItem("dictationKey");
  session.setItem("session", "only here");
  local.clear();
  assert.deepEqual(patches, [
    { type: "set", key: "dictationKey", value: "Alt+F3" },
    { type: "remove", key: "dictationKey" },
    { type: "clear" },
  ]);
});
