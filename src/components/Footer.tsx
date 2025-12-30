import Link from 'next/link';

const footerLinks = {
  about: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/careers', label: 'Careers' },
  ],
  mentees: [
    { href: '/mentors', label: 'Find a Mentor' },
    { href: '/resources', label: 'Resources' },
    { href: '/pricing', label: 'Pricing' },
  ],
  mentors: [
    { href: '/become-mentor', label: 'Become a Mentor' },
    { href: '/mentor-resources', label: 'Mentor Resources' },
    { href: '/mentor-faq', label: 'Mentor FAQ' },
  ],
  legal: [
    { href: '/legal/privacy', label: 'Privacy Policy' },
    { href: '/legal/terms', label: 'Terms of Service' },
    { href: '/legal/cookies', label: 'Cookie Policy' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-surface-200-800">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          {/* About */}
          <div>
            <h3 className="mb-3 font-bold md:mb-4">About</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-surface-600 transition-colors hover:text-primary-500 dark:text-surface-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Mentees */}
          <div>
            <h3 className="mb-3 font-bold md:mb-4">For Mentees</h3>
            <ul className="space-y-2">
              {footerLinks.mentees.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-surface-600 transition-colors hover:text-primary-500 dark:text-surface-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Mentors */}
          <div>
            <h3 className="mb-3 font-bold md:mb-4">For Mentors</h3>
            <ul className="space-y-2">
              {footerLinks.mentors.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-surface-600 transition-colors hover:text-primary-500 dark:text-surface-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 font-bold md:mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-surface-600 transition-colors hover:text-primary-500 dark:text-surface-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-surface-200-800 preset-filled-surface-50-950">
        <div className="container mx-auto p-4">
          <p className="text-center text-sm text-surface-600 dark:text-surface-400">
            &copy; {new Date().getFullYear()} mentor.energy
          </p>
        </div>
      </div>
    </footer>
  );
}
