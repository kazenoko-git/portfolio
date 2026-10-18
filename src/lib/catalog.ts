export interface CatalogEntry {
  id: string;
  collection: string;
  data: {
    title: string;
    summary: string;
    date: Date;
    cover?: string;
    draft?: boolean;
    city?: boolean;
    featuredOrder?: number;
  };
}
export function cityCatalog<T extends CatalogEntry>(entries: T[]): T[] {
  return entries
    .filter((e) => !e.data.draft && e.data.city !== false)
    .sort(
      (a, b) =>
        (a.data.featuredOrder ?? 100) - (b.data.featuredOrder ?? 100) ||
        b.data.date.valueOf() - a.data.date.valueOf() ||
        `${a.collection}/${a.id}`.localeCompare(`${b.collection}/${b.id}`),
    );
}
