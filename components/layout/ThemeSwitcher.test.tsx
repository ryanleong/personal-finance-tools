import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';

const mockSetTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ theme: 'system', setTheme: mockSetTheme })),
}));

// Mock Shadcn dropdown components so they render inline (no portals in jsdom)
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, render: renderProp }: { children: React.ReactNode; render?: React.ReactElement }) => {
    if (renderProp) {
      return React.cloneElement(renderProp, {}, children);
    }
    return <button>{children}</button>;
  },
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div role="menu">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div role="menuitem" onClick={onClick}>{children}</div>
  ),
}));

import { useTheme } from 'next-themes';
const mockUseTheme = vi.mocked(useTheme);

beforeEach(() => {
  mockSetTheme.mockClear();
  mockUseTheme.mockReturnValue({ theme: 'system', setTheme: mockSetTheme } as unknown as ReturnType<typeof useTheme>);
});

afterEach(cleanup);

describe('ThemeSwitcher � setTheme calls', () => {
  it('calls setTheme("light") when Light is selected', async () => {
    render(<ThemeSwitcher />);
    await userEvent.click(screen.getByRole('menuitem', { name: /light/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme("dark") when Dark is selected', async () => {
    render(<ThemeSwitcher />);
    await userEvent.click(screen.getByRole('menuitem', { name: /dark/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme("system") when System is selected', async () => {
    render(<ThemeSwitcher />);
    await userEvent.click(screen.getByRole('menuitem', { name: /system/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });
});

describe('ThemeSwitcher � icon display', () => {
  it('shows Sun icon when theme is light', () => {
    mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mockSetTheme } as unknown as ReturnType<typeof useTheme>);
    render(<ThemeSwitcher />);
    expect(document.querySelector('[data-icon="sun"]')).not.toBeNull();
  });

  it('shows Moon icon when theme is dark', () => {
    mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: mockSetTheme } as unknown as ReturnType<typeof useTheme>);
    render(<ThemeSwitcher />);
    expect(document.querySelector('[data-icon="moon"]')).not.toBeNull();
  });

  it('shows Monitor icon when theme is system', () => {
    mockUseTheme.mockReturnValue({ theme: 'system', setTheme: mockSetTheme } as unknown as ReturnType<typeof useTheme>);
    render(<ThemeSwitcher />);
    expect(document.querySelector('[data-icon="monitor"]')).not.toBeNull();
  });
});
