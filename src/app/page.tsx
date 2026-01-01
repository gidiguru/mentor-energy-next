'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AIChatPreview } from '@/components';

const stats = [
  { label: 'Active Mentors', value: '50+' },
  { label: 'Universities', value: '6' },
  { label: 'Success Rate', value: '85%' },
  { label: 'Student Projects', value: '200+' },
];

const features = [
  {
    title: 'Industry Mentorship',
    description:
      'Connect with experienced professionals in geology and energy sectors',
    icon: '👥',
  },
  {
    title: 'Virtual Labs',
    description:
      'Access state-of-the-art virtual geology laboratories and simulations',
    icon: '🔬',
  },
  {
    title: 'Software Training',
    description:
      'Learn industry-standard software like Petrel through guided tutorials',
    icon: '💻',
  },
  {
    title: 'Field Experience',
    description: 'Participate in virtual field trips and real-world projects',
    icon: '🌍',
  },
];

const testimonials = [
  {
    quote:
      'The mentorship program helped me secure my dream role at a leading energy company.',
    author: 'Chioma O.',
    role: '300-level Geology Student',
    organization: 'University of Ibadan',
  },
  {
    quote:
      'Being a mentor has been incredibly rewarding. The platform makes it easy to share knowledge.',
    author: 'Dr. Adeyemi S.',
    role: 'Senior Geologist',
    organization: 'Major Energy Company',
  },
];

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Redirect signed-in users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render home page if signed in (will redirect)
  if (isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-lg">Redirecting to dashboard...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-x-hidden">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 md:py-24">
        <div className="grid items-center gap-6 md:grid-cols-2 md:gap-8">
          <div className="space-y-4 md:space-y-6">
            <h1 className="h1 !text-3xl sm:!text-4xl md:!text-5xl">
              Build Your Future in Nigeria&apos;s Energy Sector
            </h1>
            <p className="text-lg sm:text-xl">
              Connect with industry mentors, access virtual labs, and gain
              practical experience while still in or out of the university.
              Bridge the gap between education and industry.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              {isSignedIn ? (
                <Link href="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
              ) : (
                <Link href="/signup" className="btn btn-primary">
                  Get Started
                </Link>
              )}
              <Link href="/mentors" className="btn btn-ghost">
                Browse Mentors
              </Link>
            </div>
          </div>
          <div className="animate-slide-up">
            <div className="preset-filled-surface-100-900 flex h-[400px] items-center justify-center rounded-lg p-8">
              <div className="text-center">
                <span className="mb-4 block text-6xl">🎓🌍</span>
                <p className="text-xl font-medium">
                  Connecting Students with Industry Experts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="preset-filled-surface-200-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary-500 md:text-4xl">
                  {stat.value}
                </p>
                <p className="text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Preview */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="h2 mb-4 text-center">Get Instant Career Guidance</h2>
        <p className="mb-8 text-center text-lg">
          Try our AI career assistant. Ask about geology careers, required
          skills, or industry trends.
        </p>
        <AIChatPreview />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="h2 mb-12 text-center">Why Choose mentor.energy?</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="card preset-filled-surface-100-900 p-6 text-center">
              <div className="mb-4 text-4xl">{feature.icon}</div>
              <h3 className="h3 mb-2">{feature.title}</h3>
              <p className="text-surface-600-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="preset-filled-surface-100-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="h2 mb-12 text-center">What Our Community Says</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author} className="card preset-filled-surface-50-950 p-6">
                <p className="mb-4 text-lg italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="font-bold">{testimonial.author}</p>
                  <p className="text-surface-600-400">
                    {testimonial.role}
                  </p>
                  <p className="text-sm text-surface-600-400">
                    {testimonial.organization}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="h2 mb-6">Ready to Start Your Journey?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl">
          Join mentor.energy today and take the first step towards a successful
          career in Nigeria&apos;s energy sector.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {isSignedIn ? (
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/signup?role=student" className="btn btn-primary">
                Sign Up as Student
              </Link>
              <Link href="/signup?role=mentor" className="btn btn-ghost">
                Become a Mentor
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
