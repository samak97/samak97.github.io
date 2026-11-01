export const nav = [
  {
    label: 'Introduction',
    items: [
      { id: 'readme', title: 'README.md' },
      { id: 'getting-started', title: 'Getting Started' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { id: 'modules', title: 'Modules (Skills)' },
      { id: 'changelog', title: 'Changelog' },
      { id: 'case-studies', title: 'Case Studies' },
      { id: 'threads', title: 'Threads' },
      { id: 'certifications', title: 'Certifications' },
      { id: 'playground', title: 'GPU Playground' },
    ],
  },
  {
    label: 'Extras',
    items: [
      { id: 'arcade', title: 'Arcade' },
      { id: 'contact', title: 'Contact' },
    ],
  },
];

export const navItems = nav.flatMap((g) => g.items);
