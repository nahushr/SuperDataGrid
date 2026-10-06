export const SUPER_DATA_GRID_AVATAR_COLORS = [
  "#1D4ED8",
  "#6D28D9",
  "#A21CAF",
  "#BE123C",
  "#B91C1C",
  "#C2410C",
  "#92400E",
  "#15803D",
  "#0F766E",
  "#0369A1",
] as const;

export function getAvatarColorIndex(id: string | number): number {
  const value = String(id);
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.codePointAt(index) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % SUPER_DATA_GRID_AVATAR_COLORS.length;
}
