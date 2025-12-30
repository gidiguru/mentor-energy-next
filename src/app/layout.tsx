import type { Metadata } from 'next';
import './globals.css';
import { Header, Footer, Drawer, MobileNav, ThemeProvider } from '@/components';

export const metadata: Metadata = {
  title: 'mentor.energy - Build Your Future in Nigeria\'s Energy Sector',
  description:
    'Connect with industry mentors, access virtual labs, and gain practical experience in geology and energy sectors.',
  keywords: [
    'mentorship',
    'geology',
    'energy sector',
    'Nigeria',
    'career development',
    'virtual labs',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <Drawer>
            <MobileNav />
          </Drawer>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
