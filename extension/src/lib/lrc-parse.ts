import type { LyricLine } from "../types";

/** Parse standard LRC synced lyrics into timed lines (seconds). */
export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const tag = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const raw of lrc.split(/\r?\n/)) {
    const textStart = raw.replace(tag, "").trim();
    tag.lastIndex = 0;
    let match: RegExpExecArray | null;
    const times: number[] = [];
    while ((match = tag.exec(raw)) !== null) {
      const min = Number(match[1]);
      const sec = Number(match[2]);
      const frac = match[3] ?? "0";
      const ms = Number(frac.padEnd(3, "0").slice(0, 3));
      times.push(min * 60 + sec + ms / 1000);
    }
    if (!times.length) continue;
    const text = textStart;
    for (const time of times) {
      lines.push({ time, text });
    }
  }

  lines.sort((a, b) => a.time - b.time);
  return lines;
}

/** Binary search: largest index with line.time <= t, or -1. */
export function activeLineIndex(lines: LyricLine[], t: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}
