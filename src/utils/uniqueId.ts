let fallbackId = 0;

/** Creates non-secret UI IDs without relying on a weak random number source. */
export function createUniqueId(prefix: string): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === "function") {
    return `${prefix}-${randomUUID.call(globalThis.crypto)}`;
  }

  fallbackId += 1;
  return `${prefix}-${Date.now()}-${fallbackId}`;
}
