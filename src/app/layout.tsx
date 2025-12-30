import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header, Footer, Drawer, MobileNav, ThemeProvider } from '@/components';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

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
      <body className={`${inter.variable} font-sans antialiased`}>
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
