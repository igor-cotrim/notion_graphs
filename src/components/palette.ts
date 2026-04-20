export const PALETTE = [
  "#F97316",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#A855F7",
  "#FACC15",
  "#06B6D4",
  "#EC4899",
  "#84CC16",
  "#6366F1",
  "#F59E0B",
  "#14B8A6",
];

export function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
