import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db, users, resources, eq } from '@/lib/db';

const sampleResources = [
  // Articles
  {
    title: 'Introduction to Petroleum Engineering',
    description: 'A comprehensive guide to understanding the fundamentals of petroleum engineering, including exploration, drilling, and production processes.',
    type: 'article',
    category: 'Petroleum Engineering',
    url: '',
    content: `
# Introduction to Petroleum Engineering

Petroleum engineering is a field of engineering concerned with the activities related to the production of hydrocarbons, which can be either crude oil or natural gas.

## Key Areas

### 1. Exploration
Petroleum engineers work with geologists to understand the subsurface geology and identify potential hydrocarbon reservoirs.

### 2. Drilling
Once a potential reservoir is identified, drilling operations begin. This involves creating a wellbore to access the hydrocarbons.

### 3. Production
After drilling, production engineers optimize the extraction of oil and gas from the reservoir.

### 4. Reservoir Engineering
Reservoir engineers analyze the behavior of oil, gas, and water flow in the reservoir to maximize recovery.

## Career Opportunities

The petroleum industry offers diverse career paths including:
- Drilling Engineer
- Production Engineer
- Reservoir Engineer
- Completion Engineer
- Facilities Engineer

## Conclusion

Petroleum engineering remains a critical field for global energy supply, with ongoing innovations in sustainable practices and technology.
    `,
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Understanding Seismic Data Interpretation',
    description: 'Learn how geophysicists use seismic data to map underground rock formations and identify potential oil and gas deposits.',
    type: 'article',
    category: 'Geophysics',
    url: '',
    content: `
# Understanding Seismic Data Interpretation

Seismic interpretation is the extraction of subsurface geological information from seismic data.

## How Seismic Surveys Work

1. **Energy Source**: A controlled energy source (vibroseis or explosives) generates seismic waves
2. **Wave Propagation**: Waves travel through the earth and reflect off rock boundaries
3. **Recording**: Geophones record the reflected waves
4. **Processing**: Data is processed to create images of subsurface structures

## Key Concepts

- **Reflection Seismology**: The primary method for oil and gas exploration
- **Acoustic Impedance**: Determines how seismic waves reflect at boundaries
- **Time-Depth Conversion**: Converting seismic time to actual depth

## Applications

Seismic data helps identify:
- Structural traps (anticlines, faults)
- Stratigraphic traps
- Reservoir extent and thickness
- Fluid contacts
    `,
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Advanced Reservoir Simulation Techniques',
    description: 'Deep dive into modern reservoir simulation methods and software used in the oil and gas industry.',
    type: 'article',
    category: 'Reservoir Engineering',
    url: '',
    content: `
# Advanced Reservoir Simulation Techniques

Reservoir simulation is a powerful tool for predicting reservoir behavior and optimizing production strategies.

## Types of Simulators

1. **Black Oil Simulators**: For conventional oil reservoirs
2. **Compositional Simulators**: For gas condensate and volatile oil reservoirs
3. **Thermal Simulators**: For heavy oil and steam injection processes

## Building a Simulation Model

- Geological model input
- Fluid property initialization
- Well placement and completion design
- History matching
- Production forecasting

## Industry Software

Popular simulation packages include:
- Eclipse (Schlumberger)
- CMG (Computer Modelling Group)
- tNavigator
- INTERSECT
    `,
    isPremium: true,
    isPublished: true,
  },
  // Videos
  {
    title: 'Offshore Drilling Operations Explained',
    description: 'Visual guide to understanding how offshore drilling platforms operate in deep water environments.',
    type: 'video',
    category: 'Drilling',
    url: 'https://www.youtube.com/watch?v=example1',
    content: '',
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Well Completion Best Practices',
    description: 'Expert walkthrough of modern well completion techniques and equipment selection.',
    type: 'video',
    category: 'Completions',
    url: 'https://www.youtube.com/watch?v=example2',
    content: '',
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Production Optimization Masterclass',
    description: 'Advanced techniques for maximizing well productivity and reducing operational costs.',
    type: 'video',
    category: 'Production',
    url: 'https://www.youtube.com/watch?v=example3',
    content: '',
    isPremium: true,
    isPublished: true,
  },
  // Documents
  {
    title: 'SPE Technical Paper: Enhanced Oil Recovery Methods',
    description: 'Society of Petroleum Engineers technical paper on modern EOR techniques and field applications.',
    type: 'document',
    category: 'Research Papers',
    url: 'https://www.spe.org/example-paper',
    content: '',
    isPremium: true,
    isPublished: true,
  },
  {
    title: 'Nigerian Oil & Gas Industry Overview 2024',
    description: 'Comprehensive report on the current state of Nigeria\'s oil and gas sector, including production statistics and future outlook.',
    type: 'document',
    category: 'Industry Reports',
    url: '',
    content: `
# Nigerian Oil & Gas Industry Overview 2024

## Production Statistics
- Daily oil production: ~1.5 million barrels
- Natural gas production: 1.5 billion cubic feet per day
- Proven reserves: 37 billion barrels of oil

## Major Operators
- Shell Petroleum Development Company
- ExxonMobil
- Chevron Nigeria
- TotalEnergies
- Nigerian National Petroleum Corporation (NNPC)

## Key Developments
- Petroleum Industry Act implementation
- Deepwater exploration expansion
- Gas monetization projects
- Local content development initiatives

## Challenges
- Security concerns in the Niger Delta
- Pipeline vandalism
- Regulatory uncertainty
- Infrastructure gaps

## Future Outlook
The industry is transitioning with focus on:
- Natural gas development
- Renewable energy integration
- Environmental sustainability
- Technology adoption
    `,
    isPremium: false,
    isPublished: true,
  },
  // Links
  {
    title: 'Society of Petroleum Engineers (SPE)',
    description: 'Official website of SPE - the largest organization for oil and gas professionals worldwide.',
    type: 'link',
    category: 'Professional Organizations',
    url: 'https://www.spe.org',
    content: '',
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Schlumberger Oilfield Glossary',
    description: 'Comprehensive dictionary of oilfield terms and definitions - essential reference for students and professionals.',
    type: 'link',
    category: 'Reference',
    url: 'https://glossary.slb.com',
    content: '',
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'PetroWiki - Petroleum Engineering Knowledge Base',
    description: 'Free online resource covering all aspects of petroleum engineering, maintained by SPE.',
    type: 'link',
    category: 'Reference',
    url: 'https://petrowiki.spe.org',
    content: '',
    isPremium: false,
    isPublished: true,
  },
  {
    title: 'Department of Petroleum Resources Nigeria',
    description: 'Official regulatory body for Nigeria\'s upstream oil and gas sector.',
    type: 'link',
    category: 'Regulatory',
    url: 'https://www.nuprc.gov.ng',
    content: '',
    isPremium: false,
    isPublished: true,
  },
];

// POST /api/admin/seed-resources - Seed sample resources (admin only)
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const database = db();

    // Verify admin role
    const currentUser = await database.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Check if resources already exist
    const existingResources = await database.query.resources.findMany();
    if (existingResources.length > 0) {
      return NextResponse.json({
        message: 'Resources already exist',
        count: existingResources.length,
      });
    }

    // Insert sample resources
    const insertedResources = await database.insert(resources).values(
      sampleResources.map(r => ({
        title: r.title,
        description: r.description,
        type: r.type,
        category: r.category,
        url: r.url || null,
        content: r.content || null,
        isPremium: r.isPremium,
        isPublished: r.isPublished,
      }))
    ).returning();

    return NextResponse.json({
      message: 'Sample resources created successfully',
      count: insertedResources.length,
    });
  } catch (error) {
    console.error('Error seeding resources:', error);
    return NextResponse.json({ error: 'Failed to seed resources' }, { status: 500 });
  }
}
