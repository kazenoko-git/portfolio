export interface CatalogEntry {
  id: string;
  collection: string;
  data: {
    title: string;
    summary: string;
    date: Date;
    projectMonth?: string;
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
        (b.data.projectMonth
          ? Date.parse(`${b.data.projectMonth}-01`)
          : b.data.date.valueOf()) -
          (a.data.projectMonth
            ? Date.parse(`${a.data.projectMonth}-01`)
            : a.data.date.valueOf()) ||
        `${a.collection}/${a.id}`.localeCompare(`${b.collection}/${b.id}`),
    );
}
