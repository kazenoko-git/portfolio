interface Entry {
  id: string;
  collection: string;
  data: {
    title: string;
    date: Date;
    dateLabel?: string;
    projectPeriod?: string;
    projectMonth?: string;
    cover?: string;
    coverAlt?: string;
    coverCaption?: string;
    coverRotation?: number;
  };
}
export function entryDate(entry: Entry) {
  if (entry.collection === 'projects' && entry.data.projectPeriod)
    return entry.data.projectPeriod;
  return `${entry.data.dateLabel === 'Published' || !entry.data.dateLabel ? '' : entry.data.dateLabel + ' · '}${entry.data.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}`;
}
export function entrySortDate(entry: Entry) {
  return entry.data.projectMonth
    ? Date.parse(`${entry.data.projectMonth}-01T00:00:00Z`)
    : entry.data.date.valueOf();
}
export function entryVisual(entry: Entry) {
  const name = entry.id.toLowerCase();
  const drawing = /prodo|focus/.test(name)
    ? 'focus'
    : /klima|climate|radiant/.test(name)
      ? 'climate'
      : /atom|quantum/.test(name)
        ? 'orbit'
        : /npu|talos|chip/.test(name)
          ? 'chip'
          : /deploy|game|eternae/.test(name)
            ? 'deploy'
            : 'code';
  return {
    src: entry.data.cover ?? `/images/projects/${drawing}.svg`,
    alt: entry.data.coverAlt ?? `${entry.data.title} — project illustration`,
    caption: entry.data.coverCaption ?? 'Project illustration',
    rotation: entry.data.coverRotation ?? 0,
  };
}
