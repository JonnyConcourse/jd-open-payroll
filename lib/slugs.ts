/**
 * Converts a string to a URL-safe slug.
 * e.g. "Department of Health" → "department-of-health"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Builds a collision-safe slug → original name map from an array of names.
 * If two names produce the same slug, the second gets a "-2" suffix, etc.
 */
export function buildSlugMap(names: string[]): Map<string, string> {
  const map = new Map<string, string>();
  const counts = new Map<string, number>();

  for (const name of names) {
    const base = toSlug(name);
    const existing = counts.get(base) ?? 0;
    counts.set(base, existing + 1);

    const slug = existing === 0 ? base : `${base}-${existing + 1}`;
    map.set(slug, name);
  }

  return map;
}

/**
 * Builds a name → slug map (inverse of buildSlugMap).
 */
export function buildNameToSlugMap(names: string[]): Map<string, string> {
  const nameToSlug = new Map<string, string>();
  const counts = new Map<string, number>();

  for (const name of names) {
    const base = toSlug(name);
    const existing = counts.get(base) ?? 0;
    counts.set(base, existing + 1);

    const slug = existing === 0 ? base : `${base}-${existing + 1}`;
    nameToSlug.set(name, slug);
  }

  return nameToSlug;
}

/**
 * Resolves a slug to an original name using a slug→name map.
 * Returns null if not found.
 */
export function resolveSlug(
  slug: string,
  slugMap: Map<string, string>
): string | null {
  return slugMap.get(slug) ?? null;
}
