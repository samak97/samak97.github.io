export type Module = {
  id: string;
  name: string;
  /** Short import-style label shown on the tab. */
  pkg: string;
  /** Relative focus, drives the bar width. Web is the main line. */
  weight: number;
  color: string;
  blurb: string;
  highlights: string[];
  stack: string[];
};

export const modules: Module[] = [
  {
    id: 'web',
    name: 'Web & Cloud',
    pkg: '@samak/web',
    weight: 100,
    color: 'var(--c-web)',
    blurb:
      'My main line. Full-stack platforms from Go and Python microservices to React front-ends, shipped every two weeks to Azure and to air-gapped government servers.',
    highlights: [
      'Team Lead on Llumen, a decision intelligence platform for government leaders',
      'Microservices for ingestion, JSON↔Parquet conversion, analytics, and LLM analysis',
      'Kubernetes + Helm deployments on Azure and fully offline on-premise',
      'Azure administration (AZ-104 on the way)',
    ],
    stack: ['TypeScript', 'React', 'Next.js', 'Go', 'Python', 'FastAPI', 'PostgreSQL', 'Supabase', 'Docker', 'Kubernetes', 'Helm', 'Azure', 'Linux'],
  },
  {
    id: 'graphics',
    name: 'Graphics & Data Viz',
    pkg: '@samak/gpu',
    weight: 90,
    color: 'var(--c-gfx)',
    blurb:
      'I own the graphics layer of Llumen: every map, every 2D and 3D visual. I care about frames per second the way others care about uptime.',
    highlights: [
      'Map rendering rebuilt on the GPU with instancing and custom shaders (100x faster)',
      'A scalable 3D GeoJSON library on Mapbox + Three.js',
      'Stories, whiteboards, and dashboards with interactive maps',
    ],
    stack: ['Three.js', 'WebGL', 'GLSL Shaders', 'GPU Instancing', 'Mapbox', 'GeoJSON', 'Canvas', 'Tween.js'],
  },
  {
    id: 'cpp',
    name: 'C/C++ & High Performance',
    pkg: '@samak/native',
    weight: 70,
    color: 'var(--c-cpp)',
    blurb:
      'Years of Modern C++ on desktop software where performance and correctness are not optional: 3D meshes, real-time interaction, and big data models.',
    highlights: [
      'Modern C++17 with VTK graphics and Qt/QML interfaces',
      'Reusable widgets and bridge classes across a plugin architecture',
      'Unreal Engine 5 plugins in C++ exposed to Blueprints',
    ],
    stack: ['C++17', 'C', 'STL', 'Qt/QML', 'VTK', 'CMake', 'Unreal Engine 5', 'Design Patterns'],
  },
  {
    id: 'medical',
    name: 'Medical Software',
    pkg: '@samak/medical',
    weight: 55,
    color: 'var(--c-med)',
    blurb:
      'Nearly three years on FDA-approved surgical planning software, now owned by Johnson & Johnson. Software where a bug is measured in millimetres.',
    highlights: [
      'PPDS: orthognathic surgery simulation in six procedural plugins',
      'Generated 3D surgical guides, plates, and screws from patient data',
      'Patient case serialization and data-model algorithms',
    ],
    stack: ['C++17', 'VTK', 'Qt/QML', '3D Meshes', 'FDA-regulated process', 'Scrum'],
  },
  {
    id: 'games',
    name: 'Game Dev',
    pkg: '@samak/games',
    weight: 65,
    color: 'var(--c-game)',
    blurb:
      'Where it all started. Educational and commercial web games, real estate sims, and Unity/Unreal projects — still my favourite freelance work.',
    highlights: [
      'Animated 2D web games for education and commerce, smooth on phones',
      'Real estate pitching simulations in Three.js',
      'Facebook Instant Game (Reveola) and several Unity games',
    ],
    stack: ['JavaScript', 'TypeScript', 'Three.js', 'Tween.js', 'CreateJS', 'Unity', 'Unreal Engine', 'Adobe Animate'],
  },
  {
    id: 'ai',
    name: 'AI & LLMs',
    pkg: '@samak/ai',
    weight: 45,
    color: 'var(--c-ai)',
    blurb:
      'AI is part of how I work and part of what we ship: LLM-powered analysis in the product and AI-assisted development in my daily workflow.',
    highlights: [
      'Services for AI/LLM-based data analysis and summarization',
      'Model Context Protocol (MCP) in the toolbox',
      'AI-assisted development with Claude Code and Cursor',
    ],
    stack: ['LLMs', 'MCP', 'Claude Code', 'Cursor', 'Python'],
  },
];
