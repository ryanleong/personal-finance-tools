'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const NAV_LINKS = [
  { href: '/analytics', label: 'Analytics' },
  { href: '/csv-formatter', label: 'CSV Formatter' },
  { href: '/retirement-calculator', label: 'Retirement Calculator' },
];

function NavLink({ href, label, pathname, onClick }: { href: string; label: string; pathname: string; onClick?: () => void }) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      data-active={isActive ? 'true' : undefined}
      className={cn(
        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      )}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto grid grid-cols-12 h-14 items-center px-4 sm:px-6 lg:px-8">
        {/* Brand — cols 1–2 on desktop, 1–6 on mobile */}
        <div className="col-span-6 md:col-span-2 flex items-center">
          <Link href="/" className="text-sm font-semibold text-foreground">
            Finance Tools
          </Link>
        </div>

        {/* Desktop nav links — cols 3–10 */}
        <nav className="hidden md:flex md:col-span-8 items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} pathname={pathname} />
          ))}
        </nav>

        {/* Right slot — cols 11–12 on desktop, 7–12 on mobile */}
        <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-2">
          {/* Desktop: theme switcher */}
          <div className="hidden md:flex">
            <ThemeSwitcher />
          </div>
          {/* Mobile: hamburger */}
          <div className="flex md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Open menu" />
                }
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="mt-6 flex flex-col gap-1">
                  {NAV_LINKS.map(({ href, label }) => (
                    <NavLink
                      key={href}
                      href={href}
                      label={label}
                      pathname={pathname}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                </nav>
                {/* Theme switcher in mobile drawer */}
                <div className="mt-4 px-3">
                  <ThemeSwitcher />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
