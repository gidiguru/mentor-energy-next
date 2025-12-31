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

  // Hide main header/footer only on admin pages (they have their own layout)
  const isAdminPage = pathname?.startsWith('/admin');
  const hideMainLayout = isAdminPage;

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
