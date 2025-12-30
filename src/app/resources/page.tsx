import Link from 'next/link';

const resources = [
  {
    title: 'Introduction to Petroleum Geology',
    type: 'Course',
    description: 'Learn the fundamentals of petroleum geology and exploration.',
    icon: '📖',
    link: '/dashboard/learning/modules',
  },
  {
    title: 'Petrel Software Guide',
    type: 'Tutorial',
    description: 'Step-by-step guide to using Petrel for geological modeling.',
    icon: '💻',
    link: '/dashboard/learning/modules',
  },
  {
    title: 'Field Mapping Techniques',
    type: 'Guide',
    description: 'Best practices for geological field mapping and data collection.',
    icon: '🗺️',
    link: '/dashboard/learning/modules',
  },
  {
    title: 'Career Path Guide',
    type: 'Article',
    description: 'Explore various career paths in the energy sector.',
    icon: '🎯',
    link: '/dashboard/learning/modules',
  },
  {
    title: 'Industry Reports 2024',
    type: 'Report',
    description: 'Latest trends and insights from Nigeria\'s energy sector.',
    icon: '📊',
    link: '/dashboard/learning/modules',
  },
  {
    title: 'Interview Preparation',
    type: 'Guide',
    description: 'Tips and common questions for energy sector interviews.',
    icon: '💼',
    link: '/dashboard/learning/modules',
  },
];

const categories = [
  { name: 'All Resources', count: 6 },
  { name: 'Courses', count: 2 },
  { name: 'Tutorials', count: 1 },
  { name: 'Guides', count: 2 },
  { name: 'Reports', count: 1 },
];

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="h1 mb-4">Learning Resources</h1>
        <p className="max-w-2xl text-lg text-surface-600 dark:text-surface-400">
          Access our library of courses, tutorials, guides, and industry reports
          to accelerate your learning journey.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="card preset-filled-surface-100-900 p-4">
            <h2 className="mb-4 font-semibold">Categories</h2>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.name}>
                  <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-100 dark:hover:bg-surface-700">
                    <span>{category.name}</span>
                    <span className="rounded-full bg-surface-200 px-2 py-0.5 text-xs dark:bg-surface-600">
                      {category.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Resources Grid */}
        <main className="lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {resources.map((resource) => (
              <div key={resource.title} className="card preset-filled-surface-100-900 p-6">
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-3xl">{resource.icon}</span>
                  <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs text-primary-500">
                    {resource.type}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold">{resource.title}</h3>
                <p className="mb-4 text-sm text-surface-600 dark:text-surface-400">
                  {resource.description}
                </p>
                <Link
                  href={resource.link}
                  className="text-sm text-primary-500 hover:underline"
                >
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
