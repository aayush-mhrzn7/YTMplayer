/** Normalize track metadata for lrclib matching. */
export function normalizeTitle(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(official\s+)?(music\s+)?video\b/gi, " ")
    .replace(/\b(lyrics?|audio|hd|4k|remaster(ed)?|explicit)\b/gi, " ")
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeArtist(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/\s*(feat\.?|ft\.?|featuring)\s+.+$/i, "")
    .replace(/\s*&\s*/g, " & ")
    .replace(/\s+/g, " ")
    .trim();
}

export function trackKey(title: string, artist: string): string {
  return `${normalizeArtist(artist).toLowerCase()}::${normalizeTitle(title).toLowerCase()}`;
}
