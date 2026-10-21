export const site = {
  name: 'kazenoko',
  kanji: '風の子',
  domain: 'ivan.wingit.tech',
  url: 'https://ivan.wingit.tech',
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
