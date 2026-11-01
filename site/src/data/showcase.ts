export type CaseStudy = {
  id: string;
  kicker: string;
  title: string;
  problem: string;
  solution: string;
  result: string;
  tags: string[];
};

export const caseStudies: CaseStudy[] = [
  {
    id: 'million-markers',
    kicker: 'Llumen · Graphics',
    title: 'From 100K to 1M+ markers',
    problem: 'Government dashboards needed huge point datasets on a live map. Past ~100K markers, the map stuttered and froze.',
    solution: 'Moved marker rendering to the GPU: one instanced draw call with custom shaders, instead of one object per marker.',
    result: 'More than 100x faster. Over a million markers pan and zoom smoothly.',
    tags: ['WebGL', 'Instancing', 'GLSL', 'Mapbox', 'Three.js'],
  },
  {
    id: 'air-gapped',
    kicker: 'Llumen · Forward Deployed',
    title: 'Shipping to servers with no internet',
    problem: 'UAE government clients run Llumen on-premise, some fully air-gapped, while the product ships bi-weekly with big changes.',
    solution: 'Kubernetes and Helm-based releases that run the same on Azure VMs and offline servers, plus on-site work to fix network and deployment issues.',
    result: 'Regular releases reaching cloud and offline government environments alike.',
    tags: ['Kubernetes', 'Helm', 'Azure', 'Air-gapped', 'Networking'],
  },
  {
    id: 'ppds',
    kicker: 'MedSoft · Medical',
    title: 'Surgery, simulated in C++',
    problem: 'Surgeons needed to plan orthognathic surgery and produce patient-specific hardware before entering the operating room.',
    solution: 'Six C++/VTK/Qt plugins covering each procedure step, including a reusable screw placement widget shared across plugins.',
    result: 'FDA-approved software, now owned by Johnson & Johnson. The widget cut about 20% of dev time in later sprints.',
    tags: ['C++17', 'VTK', 'Qt/QML', 'FDA'],
  },
  {
    id: 'imaket',
    kicker: 'Archrete · Real-time 3D',
    title: 'Walk through it before it is built',
    problem: 'Major architectural projects in the Middle East needed real-time, interactive presentations of buildings that did not exist yet.',
    solution: 'Unreal Engine 5 plugins in C++, exposed as Blueprints so artists could extend the simulations themselves.',
    result: 'iMaket simulations for large-scale developments, with blockers solved at the engine level.',
    tags: ['Unreal Engine 5', 'C++', 'Blueprints'],
  },
];

export type Game = {
  title: string;
  genre: string;
  engine: string;
  description: string;
  playUrl?: string;
  sourceUrl?: string;
  /** Shown instead of the Play button when there is no public build. */
  note?: string;
  /** Emoji-free glyph used for the generated cover art. */
  glyph: string;
  hue: number;
};

const gh = (repo: string) => ({
  playUrl: `https://samak97.github.io/${repo}/`,
  sourceUrl: `https://github.com/samak97/${repo}`,
});

export const games: Game[] = [
  {
    title: 'Solar System Simulation',
    genre: '3D Simulation',
    engine: 'Unity WebGL',
    description: 'A realistic solar system with relatively accurate distances. Focus the camera on any body and change orbit speeds.',
    glyph: '◉',
    hue: 220,
    ...gh('Solar-System-Simulation'),
  },
  {
    title: "Ben's Rent",
    genre: 'Puzzle',
    engine: 'HTML5',
    description: 'Solve the puzzle to help Ben get to work without running into Ramy.',
    glyph: '⌂',
    hue: 45,
    ...gh('Ben-s-Rent'),
  },
  {
    title: 'Super Sparty Adventures',
    genre: '2D Platformer',
    engine: 'Unity WebGL',
    description: 'Help Sparty the adventurer reach the red rose, defeating or dodging enemies on the way.',
    glyph: '✦',
    hue: 350,
    ...gh('Sparty-Bros-Adventures'),
  },
  {
    title: 'Box Shooter',
    genre: 'First-Person Shooter',
    engine: 'Unity WebGL',
    description: 'Shoot randomly spawning boxes. Each colour has its own effect: extra time or double score. It gets harder fast.',
    glyph: '⌖',
    hue: 30,
    ...gh('Box-Shooter'),
  },
  {
    title: 'Mad Ball',
    genre: '3D Roller',
    engine: 'Unity WebGL',
    description: 'Roll the ball, collect the icons, and reach the end of each level.',
    glyph: '●',
    hue: 150,
    ...gh('Mad-Ball'),
  },
  // Hidden for now at Ahmed's request; uncomment to show it again.
  // {
  //   title: 'Reveola',
  //   genre: 'Facebook Instant Game',
  //   engine: 'React',
  //   description: 'A gamified version of the Reveola review app for movies and places, built on the Instant Games API.',
  //   glyph: '★',
  //   hue: 280,
  //   note: 'Client project',
  // },
  {
    title: 'Educational Web Games',
    genre: '2D Web Games',
    engine: 'CreateJS',
    description: 'Animated learning games for students, built with designers and writers, smooth on phones and laptops.',
    glyph: '✎',
    hue: 190,
    note: 'Client project',
  },
];

export type Cert = { title: string; org: string; date: string; status?: 'in-progress' };

export const certs: Cert[] = [
  { title: 'Microsoft Certified: Azure Administrator Associate (AZ-104)', org: 'Microsoft', date: '2026', status: 'in-progress' },
  { title: 'B.Sc. in Computer Science', org: 'Menofia University, Egypt', date: '2015 – 2019' },
  { title: 'IELTS Academic — Overall Band 7.5 (C1)', org: 'British Council · IDP · Cambridge', date: 'May 2026' },
  { title: 'TOEFL iBT — Score 95', org: 'ETS', date: 'Jan 2020' },
  { title: 'Next Technology Leaders (5 courses)', org: 'ITIDA, Smart Village', date: '' },
  { title: 'Game Design and Development Specialization', org: 'Michigan State University (Coursera)', date: 'May 2018' },
  { title: 'Co-Founder & Instructor, ICPC Team', org: 'Menofia University', date: '2017 – 2019' },
];

export type Post = {
  kind: 'post' | 'article';
  /** Post text, or the article's opening lines. */
  text: string;
  /** Articles only. */
  title?: string;
  date: string;
  url: string;
  /** Thumbnail or cover image (served by X). */
  image?: string;
  /** Show a play button over the image. */
  video?: boolean;
};

// Curated X posts. Text copied from X's public embed endpoint (cdn.syndication.twimg.com/tweet-result?id=<id>).
export const posts: Post[] = [
  {
    kind: 'article',
    title: 'Jack of all trades, master of none. Did LLM revolution just flip that and put Generalists in power?',
    text: 'If you’re a fellow perfectionist, chances are you too had gone through the hell of skipping projects and killing ideas without even trying just because you think of how agonizing it will be building…',
    date: 'May 1, 2026',
    url: 'https://x.com/samak997/status/2050335855697613014',
    image: 'https://pbs.twimg.com/media/HHRAfXBWUAAnRW8.jpg',
  },
  {
    kind: 'post',
    text: 'First time messing with Swift & macOS apps. since all nice mac clipboard apps are paid I decided to make my own and snug in a few extra features :3\nAI def carried me coding a new language, built this in a few hours. I love it 😩',
    date: 'Apr 29, 2026',
    url: 'https://x.com/samak997/status/2049285813989486842',
    image: 'https://pbs.twimg.com/amplify_video_thumb/2049283248568840193/img/o1EN2z8Uajwb8Ta-.jpg',
    video: true,
  },
];
