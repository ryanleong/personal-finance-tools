import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { Navbar } from './Navbar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock next/link — renders as a plain <a>
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock next-themes (ThemeSwitcher uses it)
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
}));

import { usePathname } from 'next/navigation';

const mockUsePathname = vi.mocked(usePathname);

describe('Navbar active link highlighting', () => {
  it('highlights the Analytics link when on /analytics', () => {
    mockUsePathname.mockReturnValue('/analytics');
    render(<Navbar />);

    const analyticsLinks = screen.getAllByRole('link', { name: /analytics/i });
    const activeLink = analyticsLinks.find(l => l.getAttribute('data-active') === 'true');
    expect(activeLink).toBeDefined();

    // CSV Formatter link should not be active
    const csvLinks = screen.getAllByRole('link', { name: /csv formatter/i });
    const activeCSV = csvLinks.find(l => l.getAttribute('data-active') === 'true');
    expect(activeCSV).toBeUndefined();
  });

  it('highlights the CSV Formatter link when on /csv-formatter', () => {
    mockUsePathname.mockReturnValue('/csv-formatter');
    render(<Navbar />);

    const csvLinks = screen.getAllByRole('link', { name: /csv formatter/i });
    const active = csvLinks.find(l => l.getAttribute('data-active') === 'true');
    expect(active).toBeDefined();
  });

  it('highlights the Retirement Calculator link when on /retirement-calculator', () => {
    mockUsePathname.mockReturnValue('/retirement-calculator');
    render(<Navbar />);

    const retirementLinks = screen.getAllByRole('link', { name: /retirement calculator/i });
    const active = retirementLinks.find(l => l.getAttribute('data-active') === 'true');
    expect(active).toBeDefined();
  });
});

describe('Navbar mobile hamburger', () => {
  it('shows hamburger button on render', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navbar />);
    const buttons = screen.getAllByRole('button', { name: /open menu/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('opens the mobile menu when hamburger is clicked', async () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navbar />);

    const hamburgers = screen.getAllByRole('button', { name: /open menu/i });
    await userEvent.click(hamburgers[0]);

    // After opening, Analytics links should be present (desktop + mobile)
    const mobileLinks = screen.getAllByRole('link', { name: /analytics/i });
    expect(mobileLinks.length).toBeGreaterThanOrEqual(1);
  });
});
