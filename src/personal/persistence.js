// Restore before the settings store reads localStorage. Mirror individual changes
// so a stale secondary window cannot overwrite newer preferences as a whole.
export function attachPersonalPersistence(storage, api) {
  if (!api?.bootstrapPersonalConfiguration || !api?.patchPersonalConfiguration) return;
  const current = Object.create(null);
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    current[key] = storage.getItem(key);
  }
  const saved = api.bootstrapPersonalConfiguration(current);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return;
  for (const key of Object.keys(current)) if (!Object.hasOwn(saved, key)) storage.removeItem(key);
  for (const [key, value] of Object.entries(saved)) {
    if (typeof value === "string" && current[key] !== value) storage.setItem(key, value);
  }
  const prototype = Object.getPrototypeOf(storage);
  for (const method of ["setItem", "removeItem", "clear"]) {
    const original = prototype[method];
    prototype[method] = function (...args) {
      const result = original.apply(this, args);
      if (this === storage) {
        const change =
          method === "clear"
            ? { type: "clear" }
            : method === "removeItem"
              ? { type: "remove", key: String(args[0]) }
              : { type: "set", key: String(args[0]), value: storage.getItem(String(args[0])) };
        api.patchPersonalConfiguration(change);
      }
      return result;
    };
  }
}
