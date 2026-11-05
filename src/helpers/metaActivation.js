// Company activation/cohort telemetry is removed from the personal build.
class MetaActivation {
  start() {}
  async resync() {}
  async flush() {}
  begin() {
    return null;
  }
  stopCapture() {}
  finish() {
    return null;
  }
  cancel() {}
  purge() {}
  async close() {}
  async shutdown() {}
  dispose() {}
}
module.exports = { MetaActivation };
