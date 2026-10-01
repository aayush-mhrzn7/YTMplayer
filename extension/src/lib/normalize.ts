/** Normalize track metadata for lrclib matching. */

const FEAT_INLINE =
  /\b(?:feat\.?|ft\.?|featuring)\s+(.+)$/i;
const FEAT_PAREN =
  /[\(\[]\s*(?:feat\.?|ft\.?|featuring)\s+([^\)\]]+)[\)\]]/gi;

/** Parentheticals that distinguish recordings (keep in track_name). */
const VERSION_TAG =
  /\b(live|acoustic|remix|mix|demo|unplugged|session|cover|karaoke|instrumental|extended|radio\s*edit|slowed|reverb|sped\s*up)\b/i;

function splitArtistList(raw: string): string[] {
  return raw
    .split(/\s*(?:,|&|\/|\+| x | and )\s*/i)
    .map((a) => a.replace(/[“”"']/g, "").trim())
    .filter(Boolean);
}

function dedupeArtists(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Featured guests from title/artist strings like "(feat. SZA)" or "X feat. Y". */
export function extractFeaturedArtists(raw: string): string[] {
  const text = raw.normalize("NFKC");
  const found: string[] = [];

  for (const m of text.matchAll(FEAT_PAREN)) {
    found.push(...splitArtistList(m[1]));
  }

  const withoutParens = text.replace(/[\(\[][^\)\]]*[\)\]]/g, " ");
  const bare = withoutParens.match(FEAT_INLINE);
  if (bare) {
    found.push(...splitArtistList(bare[1]));
  }

  return dedupeArtists(found);
}

/** Version tokens used to tell studio vs live/remix/etc. apart. */
export function versionTokens(raw: string): Set<string> {
  const out = new Set<string>();
  const text = raw.normalize("NFKC").toLowerCase();
  for (const m of text.matchAll(
    /\b(live|acoustic|remix|mix|demo|unplugged|session|cover|karaoke|instrumental|extended|slowed|reverb)\b/g,
  )) {
    out.add(m[1]);
  }
  if (/\bradio\s*edit\b/.test(text)) out.add("radio edit");
  if (/\bsped\s*up\b/.test(text)) out.add("sped up");
  return out;
}

export function normalizeTitle(raw: string): string {
  const versions: string[] = [];

  let text = raw.normalize("NFKC").replace(/[\(\[]([^\)\]]*)[\)\]]/g, (_, inner: string) => {
    const t = inner.trim();
    if (/^(?:feat\.?|ft\.?|featuring)\b/i.test(t)) return " ";
    if (VERSION_TAG.test(t)) {
      versions.push(t);
      return " ";
    }
    return " ";
  });

  text = text
    .replace(/\b(official\s+)?(music\s+)?video\b/gi, " ")
    .replace(/\b(lyrics?|audio|hd|4k|remaster(ed)?|explicit)\b/gi, " ")
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (versions.length) {
    text = `${text} (${versions.join("; ")})`;
  }
  return text;
}

export function normalizeArtist(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/\s*(feat\.?|ft\.?|featuring)\s+.+$/i, "")
    .replace(/\s*&\s*/g, " & ")
    .replace(/\s+/g, " ")
    .trim();
}

function artistAlreadyListed(primary: string, feat: string): boolean {
  const pl = primary.toLowerCase();
  const fl = feat.toLowerCase();
  if (pl === fl) return true;
  return pl.split(/[\s&/,]+/).includes(fl);
}

/**
 * Artist string for lrclib queries: primary + featured guests from title/artist.
 * e.g. title "Kiss Me More (feat. SZA)", artist "Doja Cat" → "Doja Cat, SZA"
 */
export function buildQueryArtist(artist: string, title: string): string {
  const primary = normalizeArtist(artist);
  if (!primary) return "";

  const feats = dedupeArtists([
    ...extractFeaturedArtists(artist),
    ...extractFeaturedArtists(title),
  ]).filter((f) => !artistAlreadyListed(primary, f));

  if (!feats.length) return primary;
  return `${primary}, ${feats.join(", ")}`;
}

export function trackKey(title: string, artist: string): string {
  return `${normalizeArtist(artist).toLowerCase()}::${normalizeTitle(title).toLowerCase()}`;
}
