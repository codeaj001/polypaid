/** Turns a memo + handle into a short, URL-safe, unique-ish slug. */
export function generateSlug(memo: string, handle?: string): string {
  const base =
    (handle ? `${handle}-` : '') +
    memo
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join('-');

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'pay'}-${suffix}`;
}
