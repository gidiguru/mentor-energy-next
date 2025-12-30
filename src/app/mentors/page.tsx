import Link from 'next/link';

const mentors = [
  {
    id: 1,
    name: 'Dr. Adeyemi S.',
    role: 'Senior Geologist',
    company: 'Major Energy Company',
    expertise: ['Petroleum Geology', 'Reservoir Analysis', 'Field Operations'],
    image: null,
  },
  {
    id: 2,
    name: 'Eng. Fatima A.',
    role: 'Geophysicist',
    company: 'Oil & Gas Services',
    expertise: ['Seismic Interpretation', 'Data Analysis', 'Software Training'],
    image: null,
  },
  {
    id: 3,
    name: 'Prof. Chukwuma O.',
    role: 'Professor of Geology',
    company: 'University of Lagos',
    expertise: ['Structural Geology', 'Research', 'Academic Guidance'],
    image: null,
  },
  {
    id: 4,
    name: 'Dr. Amina B.',
    role: 'Environmental Consultant',
    company: 'Green Energy Solutions',
    expertise: ['Environmental Impact', 'Sustainability', 'Policy'],
    image: null,
  },
];

export default function MentorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="h1 mb-4">Find Your Mentor</h1>
        <p className="mx-auto max-w-2xl text-lg text-surface-600 dark:text-surface-400">
          Connect with experienced professionals in Nigeria&apos;s energy sector.
          Our mentors are here to guide your career journey.
        </p>
      </div>

      {/* Filters (placeholder) */}
      <div className="mb-8 flex flex-wrap gap-4">
        <select className="input max-w-xs">
          <option value="">All Expertise</option>
          <option value="geology">Petroleum Geology</option>
          <option value="geophysics">Geophysics</option>
          <option value="environmental">Environmental</option>
        </select>
        <select className="input max-w-xs">
          <option value="">All Industries</option>
          <option value="oil-gas">Oil & Gas</option>
          <option value="mining">Mining</option>
          <option value="academic">Academic</option>
        </select>
      </div>

      {/* Mentors Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mentors.map((mentor) => (
          <div key={mentor.id} className="card preset-filled-surface-100-900 p-6">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-200 text-4xl dark:bg-surface-700">
              👤
            </div>
            <h3 className="h3 mb-1">{mentor.name}</h3>
            <p className="text-primary-500">{mentor.role}</p>
            <p className="mb-4 text-sm text-surface-500">{mentor.company}</p>

            <div className="mb-4 flex flex-wrap gap-2">
              {mentor.expertise.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-surface-100 px-2 py-1 text-xs dark:bg-surface-700"
                >
                  {skill}
                </span>
              ))}
            </div>

            <Link href="/signup" className="btn btn-primary w-full">
              Connect
            </Link>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <h2 className="h3 mb-4">Want to become a mentor?</h2>
        <p className="mb-6 text-surface-600 dark:text-surface-400">
          Share your expertise and help shape the next generation of
          professionals.
        </p>
        <Link href="/signup" className="btn btn-secondary">
          Apply as Mentor
        </Link>
      </div>
    </div>
  );
}
