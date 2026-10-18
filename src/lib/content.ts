import { getCollection } from 'astro:content';
import { cityCatalog } from './catalog';
export async function featuredContent() {
  const entries = [
    ...(await getCollection('projects', ({ data }) => !data.draft)),
    ...(await getCollection('writing', ({ data }) => !data.draft)),
    ...(await getCollection('papers', ({ data }) => !data.draft)),
    ...(await getCollection('certifications', ({ data }) => !data.draft)),
  ];
  return entries
    .filter((e) => e.data.featured)
    .sort((a, b) => a.data.featuredOrder - b.data.featuredOrder);
}
export async function frontpageContent() {
  const entries = [
    ...(await getCollection('projects', ({ data }) => !data.draft)),
    ...(await getCollection('writing', ({ data }) => !data.draft)),
    ...(await getCollection('papers', ({ data }) => !data.draft)),
    ...(await getCollection('certifications', ({ data }) => !data.draft)),
  ];
  return cityCatalog(entries);
}
export function readingTime(body = '') {
  return Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 220));
}
export function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
