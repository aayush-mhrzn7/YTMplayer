/** Sample a prominent accent color from album art (extension SW / any privileged context). */

function isNearNeutral(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return sat < 0.12 || lum < 0.08 || lum > 0.92;
}

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

/**
 * Returns `"r, g, b"` suitable for CSS `rgba(var(--accent-rgb), a)`,
 * biased toward a vivid, mid-luminance color from the cover.
 */
export async function sampleAccentRgb(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const size = 32;
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, size, size);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, size, size);
    type Bucket = { n: number; r: number; g: number; b: number; score: number };
    const buckets = new Map<string, Bucket>();

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 200) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isNearNeutral(r, g, b)) continue;

      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const sat = saturation(r, g, b);
      const existing = buckets.get(key);
      if (existing) {
        existing.n += 1;
        existing.r += r;
        existing.g += g;
        existing.b += b;
        existing.score += 1 + sat * 2;
      } else {
        buckets.set(key, { n: 1, r, g, b, score: 1 + sat * 2 });
      }
    }

    let best: Bucket | null = null;
    for (const bucket of buckets.values()) {
      if (!best || bucket.score > best.score) best = bucket;
    }
    if (!best || best.n < 2) {
      // Fall back to average of all pixels (including neutrals), darkened
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 200) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n += 1;
      }
      if (!n) return null;
      return soften(r / n, g / n, b / n);
    }

    return soften(best.r / best.n, best.g / best.n, best.b / best.n);
  } catch {
    return null;
  }
}

/** Darken / compress toward usable glass tint while keeping hue. */
function soften(r: number, g: number, b: number): string {
  const mix = 0.55;
  const base = 16;
  const outR = Math.round(r * mix + base * (1 - mix));
  const outG = Math.round(g * mix + base * (1 - mix));
  const outB = Math.round(b * mix + base * (1 - mix));
  return `${outR}, ${outG}, ${outB}`;
}
