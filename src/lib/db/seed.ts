import { db, learningModules, moduleSections, sectionPages, mediaContent, resources } from './index';

// Mock petroleum industry curriculum
const mockModules = [
  {
    moduleId: 'intro-petroleum',
    title: 'Introduction to Petroleum Engineering',
    description: 'Learn the fundamentals of petroleum engineering, including reservoir basics, drilling concepts, and industry overview.',
    duration: '4 hours',
    discipline: 'petroleum',
    difficultyLevel: 'beginner',
    learningObjectives: [
      'Understand the oil and gas value chain',
      'Learn basic reservoir concepts',
      'Identify key drilling equipment and processes',
      'Recognize career paths in petroleum engineering'
    ],
    status: 'published' as const,
    orderIndex: 1,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800',
  },
  {
    moduleId: 'reservoir-fundamentals',
    title: 'Reservoir Engineering Fundamentals',
    description: 'Deep dive into reservoir characterization, fluid properties, and production mechanisms.',
    duration: '6 hours',
    discipline: 'petroleum',
    difficultyLevel: 'intermediate',
    learningObjectives: [
      'Analyze reservoir rock and fluid properties',
      'Calculate original oil/gas in place',
      'Understand drive mechanisms',
      'Apply material balance equations'
    ],
    status: 'published' as const,
    orderIndex: 2,
    thumbnailUrl: 'https://images.unsplash.com/photo-1581093458791-9d42e3c2fd45?w=800',
  },
  {
    moduleId: 'drilling-operations',
    title: 'Drilling Operations & Well Control',
    description: 'Master drilling techniques, equipment, and well control procedures for safe operations.',
    duration: '8 hours',
    discipline: 'drilling',
    difficultyLevel: 'intermediate',
    learningObjectives: [
      'Design a drilling program',
      'Select appropriate drilling fluids',
      'Implement well control procedures',
      'Troubleshoot common drilling problems'
    ],
    status: 'published' as const,
    orderIndex: 3,
    thumbnailUrl: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800',
  },
  {
    moduleId: 'production-optimization',
    title: 'Production Engineering & Optimization',
    description: 'Learn production systems, artificial lift methods, and optimization techniques.',
    duration: '5 hours',
    discipline: 'production',
    difficultyLevel: 'advanced',
    learningObjectives: [
      'Design production systems',
      'Select artificial lift methods',
      'Optimize well performance',
      'Troubleshoot production problems'
    ],
    status: 'published' as const,
    orderIndex: 4,
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  },
  {
    moduleId: 'geology-basics',
    title: 'Petroleum Geology Essentials',
    description: 'Understand geological concepts critical to finding and developing oil and gas reserves.',
    duration: '5 hours',
    discipline: 'geology',
    difficultyLevel: 'beginner',
    learningObjectives: [
      'Identify sedimentary rock types',
      'Understand petroleum system elements',
      'Interpret well logs',
      'Recognize trap types and seal mechanisms'
    ],
    status: 'published' as const,
    orderIndex: 5,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  },
];

const mockSections: Record<string, Array<{ title: string; description: string; sequence: number; estimatedDuration: string }>> = {
  'intro-petroleum': [
    { title: 'The Oil & Gas Industry Overview', description: 'History, current state, and future of the petroleum industry', sequence: 1, estimatedDuration: '45 min' },
    { title: 'Upstream, Midstream, Downstream', description: 'Understanding the value chain segments', sequence: 2, estimatedDuration: '30 min' },
    { title: 'Basic Reservoir Concepts', description: 'Introduction to porosity, permeability, and saturation', sequence: 3, estimatedDuration: '1 hour' },
    { title: 'Drilling Fundamentals', description: 'Overview of drilling rigs and operations', sequence: 4, estimatedDuration: '45 min' },
    { title: 'Career Paths in Energy', description: 'Explore various roles and progression opportunities', sequence: 5, estimatedDuration: '30 min' },
  ],
  'reservoir-fundamentals': [
    { title: 'Rock Properties', description: 'Porosity, permeability, and rock mechanics', sequence: 1, estimatedDuration: '1 hour' },
    { title: 'Fluid Properties', description: 'Oil, gas, and water characteristics', sequence: 2, estimatedDuration: '1 hour' },
    { title: 'Reservoir Drive Mechanisms', description: 'Natural energy sources for production', sequence: 3, estimatedDuration: '1.5 hours' },
    { title: 'Volumetric Calculations', description: 'Estimating OOIP and OGIP', sequence: 4, estimatedDuration: '1.5 hours' },
    { title: 'Material Balance', description: 'Reservoir performance prediction', sequence: 5, estimatedDuration: '1 hour' },
  ],
  'drilling-operations': [
    { title: 'Drilling Rig Components', description: 'Understanding the rig and its systems', sequence: 1, estimatedDuration: '1.5 hours' },
    { title: 'Drilling Fluids', description: 'Mud systems and their functions', sequence: 2, estimatedDuration: '1.5 hours' },
    { title: 'Drill Bit Selection', description: 'Choosing the right bit for the formation', sequence: 3, estimatedDuration: '1 hour' },
    { title: 'Well Control Principles', description: 'Kick detection and well control methods', sequence: 4, estimatedDuration: '2 hours' },
    { title: 'Casing & Cementing', description: 'Wellbore isolation and integrity', sequence: 5, estimatedDuration: '2 hours' },
  ],
  'production-optimization': [
    { title: 'Production Systems', description: 'From reservoir to surface facilities', sequence: 1, estimatedDuration: '1 hour' },
    { title: 'Artificial Lift Methods', description: 'ESP, rod pump, gas lift, and more', sequence: 2, estimatedDuration: '1.5 hours' },
    { title: 'Well Testing', description: 'Pressure transient analysis', sequence: 3, estimatedDuration: '1 hour' },
    { title: 'Production Optimization', description: 'Maximizing recovery and efficiency', sequence: 4, estimatedDuration: '1 hour' },
    { title: 'Troubleshooting', description: 'Common production problems and solutions', sequence: 5, estimatedDuration: '30 min' },
  ],
  'geology-basics': [
    { title: 'Sedimentary Rocks', description: 'Formation and classification', sequence: 1, estimatedDuration: '1 hour' },
    { title: 'Petroleum System Elements', description: 'Source, reservoir, seal, and trap', sequence: 2, estimatedDuration: '1.5 hours' },
    { title: 'Structural Geology', description: 'Faults, folds, and traps', sequence: 3, estimatedDuration: '1 hour' },
    { title: 'Well Log Interpretation', description: 'Basic log reading skills', sequence: 4, estimatedDuration: '1 hour' },
    { title: 'Seismic Basics', description: 'Introduction to seismic data', sequence: 5, estimatedDuration: '30 min' },
  ],
};

const mockPages: Record<string, Array<{ title: string; content: string; pageType: 'lesson' | 'quiz'; sequence: number; estimatedDuration: string }>> = {
  'The Oil & Gas Industry Overview': [
    {
      title: 'History of the Petroleum Industry',
      content: `# History of the Petroleum Industry

The petroleum industry has shaped the modern world like few other industries. From the first commercial oil well drilled by Edwin Drake in Titusville, Pennsylvania in 1859, to today's global energy complex, the journey has been remarkable.

## Key Milestones

### The Early Days (1859-1900)
- **1859**: Drake's Well marks the birth of the modern oil industry
- **1870**: John D. Rockefeller founds Standard Oil
- **1885**: First offshore wells drilled from piers in California

### The Growth Era (1900-1950)
- **1901**: Spindletop gusher in Texas transforms the industry
- **1908**: Oil discovered in Persia (modern-day Iran)
- **1938**: Oil discovered in Saudi Arabia and Kuwait

### Modern Era (1950-Present)
- **1960**: OPEC founded
- **1970s**: Oil crises reshape global economics
- **2000s**: Shale revolution transforms North America
- **2020s**: Energy transition and sustainability focus

## The Industry Today

The oil and gas industry remains one of the largest sectors globally, employing millions and producing the energy that powers transportation, manufacturing, and daily life.

> "Oil is the blood of modern civilization." - Industry saying

### Key Statistics
- Global oil demand: ~100 million barrels per day
- Natural gas demand: ~400 billion cubic meters per year
- Industry workforce: ~6 million direct employees worldwide`,
      pageType: 'lesson',
      sequence: 1,
      estimatedDuration: '15 min',
    },
    {
      title: 'Understanding Energy Markets',
      content: `# Understanding Energy Markets

Energy markets are complex systems where buyers and sellers trade crude oil, natural gas, and refined products. Understanding these markets is essential for anyone entering the petroleum industry.

## Types of Markets

### Physical Markets
Trading actual barrels of oil or volumes of gas for delivery.

### Futures Markets
Trading contracts for future delivery, primarily for hedging and speculation.

### Key Benchmarks
- **WTI (West Texas Intermediate)**: US benchmark
- **Brent Crude**: International benchmark
- **Henry Hub**: US natural gas benchmark

## Price Drivers

1. **Supply & Demand**: The fundamental driver
2. **Geopolitical Events**: Wars, sanctions, political instability
3. **OPEC Decisions**: Production quotas affect global supply
4. **Weather**: Hurricanes, cold winters, hot summers
5. **Economic Growth**: GDP correlates with energy demand
6. **Currency Fluctuations**: Oil is priced in USD

## Market Participants

- **Producers**: Companies that extract oil and gas
- **Refiners**: Convert crude to products
- **Traders**: Buy and sell for profit
- **Consumers**: End users of energy products
- **Speculators**: Financial participants`,
      pageType: 'lesson',
      sequence: 2,
      estimatedDuration: '15 min',
    },
    {
      title: 'Industry Overview Quiz',
      content: `# Test Your Knowledge

Complete this quiz to check your understanding of the petroleum industry overview.`,
      pageType: 'quiz',
      sequence: 3,
      estimatedDuration: '10 min',
    },
  ],
};

const mockResources = [
  {
    title: 'SPE Technical Papers Collection',
    description: 'Access to Society of Petroleum Engineers technical papers on various topics.',
    type: 'document',
    category: 'Technical',
    url: 'https://www.spe.org/en/publications/',
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Drilling Engineering Handbook',
    description: 'Comprehensive guide to drilling operations, equipment, and best practices.',
    type: 'document',
    category: 'Drilling',
    url: '#',
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Reservoir Simulation Basics',
    description: 'Video tutorial series on reservoir simulation fundamentals.',
    type: 'video',
    category: 'Reservoir',
    url: 'https://www.youtube.com/watch?v=example',
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Career Guide: Breaking into Oil & Gas',
    description: 'Step-by-step guide for students and career changers entering the industry.',
    type: 'article',
    category: 'Career',
    content: `# Breaking into Oil & Gas: A Complete Guide

## Introduction
The oil and gas industry offers rewarding careers with competitive salaries and global opportunities...`,
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Well Control Certification Prep',
    description: 'Preparation materials for IWCF and IADC well control certifications.',
    type: 'document',
    category: 'Certifications',
    url: '#',
    isPremium: true,
    isPublished: true,
  },
  {
    title: 'Production Optimization Techniques',
    description: 'Advanced techniques for maximizing well and field production.',
    type: 'video',
    category: 'Production',
    url: 'https://www.youtube.com/watch?v=example2',
    isPremium: true,
    isPublished: true,
  },
];

export async function seedDatabase() {
  const database = db();

  console.log('🌱 Starting database seed...');

  // Insert modules
  console.log('📚 Inserting learning modules...');
  const insertedModules = await database.insert(learningModules).values(mockModules).returning();
  console.log(`   ✓ Inserted ${insertedModules.length} modules`);

  // Create a map of module IDs
  const moduleIdMap = new Map(insertedModules.map(m => [m.moduleId, m.id]));

  // Insert sections for each module
  console.log('📑 Inserting module sections...');
  let totalSections = 0;
  const sectionIdMap = new Map<string, string>();

  for (const [moduleKey, sections] of Object.entries(mockSections)) {
    const moduleUuid = moduleIdMap.get(moduleKey);
    if (!moduleUuid) continue;

    const sectionsWithModuleId = sections.map(s => ({
      ...s,
      moduleId: moduleUuid,
    }));

    const insertedSections = await database.insert(moduleSections).values(sectionsWithModuleId).returning();
    insertedSections.forEach(s => sectionIdMap.set(s.title, s.id));
    totalSections += insertedSections.length;
  }
  console.log(`   ✓ Inserted ${totalSections} sections`);

  // Insert pages for sections
  console.log('📄 Inserting section pages...');
  let totalPages = 0;

  for (const [sectionTitle, pages] of Object.entries(mockPages)) {
    const sectionUuid = sectionIdMap.get(sectionTitle);
    if (!sectionUuid) continue;

    const pagesWithSectionId = pages.map(p => ({
      ...p,
      sectionId: sectionUuid,
    }));

    await database.insert(sectionPages).values(pagesWithSectionId);
    totalPages += pages.length;
  }
  console.log(`   ✓ Inserted ${totalPages} pages`);

  // Insert resources
  console.log('📦 Inserting resources...');
  const insertedResources = await database.insert(resources).values(mockResources).returning();
  console.log(`   ✓ Inserted ${insertedResources.length} resources`);

  console.log('✅ Database seed complete!');

  return {
    modules: insertedModules.length,
    sections: totalSections,
    pages: totalPages,
    resources: insertedResources.length,
  };
}

// Export for API route
export { mockModules, mockSections, mockPages, mockResources };
