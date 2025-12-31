'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { Drawer } from './Drawer';
import { MobileNav } from './MobileNav';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Hide main header/footer on admin and learn lesson pages (they have their own layouts)
  const isAdminPage = pathname?.startsWith('/admin');
  const isLearnPage = pathname?.startsWith('/learn/') && pathname.split('/').length > 2;
  const hideMainLayout = isAdminPage || isLearnPage;

  if (hideMainLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <Drawer>
        <MobileNav />
      </Drawer>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
