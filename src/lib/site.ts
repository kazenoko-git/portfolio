export const site = {
  name: 'kazenoko',
  kanji: '風の子',
  domain: 'kazenoko.pages.dev',
  url: 'https://kazenoko.pages.dev',
  author: 'Ivan Samuel',
  repository: 'https://github.com/kazenoko-git/portfolio',
  description:
    'Projects, papers, and notes by Ivan Samuel (kazenoko), exploring silicon, software, and machine learning.',
  email: null as string | null,
  socials: [
    { label: 'GitHub', url: 'https://github.com/kazenoko-git' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/kazenoko/' },
  ] as { label: string; url: string }[],
};
export const navigation = [
  ['Blogs', '/writing'],
  ['Projects', '/projects'],
  ['Papers', '/papers'],
  ['Certifications', '/certifications'],
  ['About', '/#profile'],
  ['Contact', '/contact'],
];
