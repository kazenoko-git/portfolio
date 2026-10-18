export function normalizeSearch(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}
export function matchesEntry(
  text: string,
  tags: string[],
  query: string,
  tag: string,
) {
  const haystack = normalizeSearch(text);
  return (
    (!tag || tags.some((t) => normalizeSearch(t) === normalizeSearch(tag))) &&
    normalizeSearch(query)
      .split(/\s+/)
      .filter(Boolean)
      .every((word) => haystack.includes(word))
  );
}
