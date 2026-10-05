/** Direction for an arrow key, or 0 when the key does not move the selection. */
export function arrowStep(key: string): -1 | 0 | 1 {
  if (key === "ArrowRight" || key === "ArrowDown") return 1;
  if (key === "ArrowLeft" || key === "ArrowUp") return -1;
  return 0;
}

/** Next enabled index from `from` in direction `step`, wrapping; -1 when none is enabled. */
export function nextEnabledIndex(disabled: readonly boolean[], from: number, step: -1 | 1): number {
  const count = disabled.length;
  for (let offset = 1; offset <= count; offset += 1) {
    const index = (from + step * offset + count * offset) % count;
    if (!disabled[index]) return index;
  }
  return -1;
}
