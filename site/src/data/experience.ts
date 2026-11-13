export type Release = {
  version: string;
  title: string;
  company: string;
  location: string;
  dates: string;
  /** Runs alongside the main line (rendered as a side branch in the changelog). */
  branch?: string;
  latest?: boolean;
  summary: string;
  bullets: string[];
  tags: string[];
};

export const releases: Release[] = [
  {
    version: 'v6.0.0',
    title: 'Senior Engineer & Delivery Team Lead',
    company: 'Pixonal',
    location: 'Dubai, UAE',
    dates: 'Feb 2026 – Present',
    latest: true,
    summary: 'Leading the Llumen delivery team and deploying it for UAE government clients as a Forward Deployed Engineer.',
    bullets: [
      'Lead the delivery team for Llumen, Pixonal’s decision intelligence platform that brings data, analytics, models, and AI into one environment for government leaders in the UAE.',
      'Forward Deployed Engineer for UAE government entities: run on-site meetings and requirement workshops, and turn operational needs into product features and configurations.',
      'Deploy and operate the platform on Microsoft Azure (AKS, VMs, networking) with Kubernetes and Helm, and on air-gapped on-premise servers; redesigned secure team access to client environments without extra VMs, cutting infrastructure costs.',
    ],
    tags: ['Leadership', 'FDE', 'Azure', 'Kubernetes', 'Helm', 'Air-Gapped'],
  },
  {
    version: 'v5.0.0',
    title: 'Senior Software Engineer',
    company: 'Pixonal',
    location: 'Sheikh Zayed, Egypt',
    dates: 'Jan 2025 – Feb 2026',
    summary: 'Llumen’s map and 2D/3D graphics, dashboards for decision-makers, and Go services.',
    bullets: [
      'Own Llumen’s map and 2D/3D graphics; re-engineered map rendering with GPU instancing and custom shaders: more than 100x faster, from struggling at 100K markers to over 1 million rendered smoothly.',
      'Built the stories, whiteboards, and dashboards system that government decision-makers use, with complex components and interactive map visualizations.',
      'Built a scalable 3D GeoJSON visualization library on Mapbox and Three.js.',
      'Built Go and Python microservices for data ingestion and LLM-based analysis.',
    ],
    tags: ['Three.js', 'WebGL', 'Shaders', 'Mapbox', 'Go', 'TypeScript', 'Python', 'React', 'Next.js', 'PostgreSQL'],
  },
  {
    version: 'v4.0.0',
    title: 'Senior Software Engineer',
    company: 'MedSoft',
    location: 'Cairo, Egypt (Hybrid)',
    dates: 'Apr 2022 – Dec 2024',
    summary: 'FDA-approved surgical simulation software in Modern C++, now owned by Johnson & Johnson.',
    bullets: [
      'Worked on PPDS, FDA-approved high-performance software for simulating orthognathic surgery: six plugins covering every procedure step, from simulation to generating surgical guides, plates, and screws.',
      'Re-designed the screw placement and editing feature into a reusable widget, saving about 20% of development time in later sprints.',
      'Built bridge classes connecting Qt/QML interfaces to the C++ back-end.',
      'Implemented data-model algorithms to serialize patient data into case folders, and features to design and generate 3D surgical hardware.',
      'Collaborated with teams in the USA and India using Scrum and Jira.',
    ],
    tags: ['C++17', 'VTK', 'Qt/QML', 'CMake', 'Medical', 'FDA'],
  },
  {
    version: 'v3.5.0',
    title: 'Senior Front-End Software Engineer',
    company: 'Bld.ai',
    location: 'USA (Remote)',
    dates: 'Sep 2022 – Feb 2023',
    summary: 'Responsive web and mobile interfaces for a US company, fully remote.',
    bullets: [
      'Built responsive, dynamic user interfaces for web and mobile platforms using React and React Native.',
      'Worked with design and back-end teams to integrate APIs and deliver seamless user experiences.',
    ],
    tags: ['React', 'React Native', 'Remote'],
  },
  {
    version: 'v3.0.0',
    title: 'Unreal Engine Developer',
    company: 'Archrete',
    location: 'New Cairo, Egypt (On-Site)',
    dates: 'Aug 2021 – May 2022',
    summary: 'Real-time architectural simulation with Unreal Engine 5 and C++.',
    bullets: [
      'Worked on iMaket, a real-time simulation product for major architectural projects in the Middle East.',
      'Designed and implemented Unreal Engine 5 plugins in C++ exposed as Blueprints.',
      'Delivered tailored .NET solutions in C# based on client requirements.',
    ],
    tags: ['Unreal Engine 5', 'C++', 'C#', '.NET'],
  },
  {
    version: 'v2.0.0',
    title: 'JavaScript Game Developer',
    company: 'ElMoasserBooks',
    location: 'Cairo, Egypt (On-Site)',
    dates: 'Aug 2020 – Aug 2021',
    summary: 'Educational web games that run smoothly on phones and laptops.',
    bullets: [
      'Developed educational web games with designers and writers, optimized for phones and laptops.',
      'Used JavaScript, CreateJS, Three.js, Adobe Animate, and Unity.',
    ],
    tags: ['JavaScript', 'CreateJS', 'Three.js', 'Unity'],
  },
  {
    version: 'freelance',
    branch: 'feature/freelance',
    title: 'Freelance Interactive Web & Game Developer',
    company: 'Self-Employed',
    location: 'Remote',
    dates: '2020 – Present',
    summary: 'Animated 2D web games and real estate pitching sims for clients, on any device.',
    bullets: [
      'Build animated 2D web games for educational and commercial clients, smooth on phones, tablets, and desktops.',
      'Develop lightweight real estate pitching simulations: interactive Three.js and 2D web apps for sales teams.',
      'Built Reveola, a Facebook Instant Game in React, a gamified version of the Reveola review app.',
    ],
    tags: ['TypeScript', 'Three.js', 'Tween.js', 'CreateJS', 'Canvas'],
  },
];
