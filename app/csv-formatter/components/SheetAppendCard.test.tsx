import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SheetAppendCard, type SheetAppendCardProps } from './SheetAppendCard';

const base: SheetAppendCardProps = {
  sheetTarget: { title: 'Budget', tabs: ['Jan'], sheetUrl: 'https://x/y', status: 'ready' },
  selectedTab: 'Jan',
  appendStatus: 'idle',
  appendError: null,
  previewRows: [{ date: '01/02/2025', description: 'Coffee', amount: -3.5 }],
  onTabSelect: vi.fn(),
  onAppend: vi.fn(),
  onReset: vi.fn(),
};

describe('SheetAppendCard', () => {
  afterEach(cleanup);

  it('appends when clicked and shows preview columns', async () => {
    const onAppend = vi.fn();
    render(<SheetAppendCard {...base} onAppend={onAppend} />);
    expect(screen.getByText('Account')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Append to Sheet' }));
    expect(onAppend).toHaveBeenCalled();
  });

  it('disables append and links to the sheet after success', () => {
    render(<SheetAppendCard {...base} appendStatus="done" />);
    expect((screen.getByRole('button', { name: 'Append to Sheet' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('link', { name: 'Open sheet' }).getAttribute('href')).toBe('https://x/y');
  });

  it('deep-links to the selected tab, including gid 0', () => {
    const target = { ...base.sheetTarget, tabs: ['Jan', 'Feb'], tabGids: { Jan: 0, Feb: 42 } };
    const { rerender } = render(<SheetAppendCard {...base} sheetTarget={target} appendStatus="done" />);
    expect(screen.getByRole('link', { name: 'Open sheet' }).getAttribute('href')).toBe('https://x/y#gid=0');
    rerender(<SheetAppendCard {...base} sheetTarget={target} selectedTab="Feb" appendStatus="done" />);
    expect(screen.getByRole('link', { name: 'Open sheet' }).getAttribute('href')).toBe('https://x/y#gid=42');
  });

  it('shows the error and keeps append enabled', () => {
    render(<SheetAppendCard {...base} appendStatus="error" appendError="Boom" />);
    expect(screen.getByText('Boom')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Append to Sheet' }) as HTMLButtonElement).disabled).toBe(false);
  });
});
