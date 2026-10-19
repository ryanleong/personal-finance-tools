import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SheetSourceBar, type SheetSourceBarProps } from './SheetSourceBar';

const base: SheetSourceBarProps = {
  tabs: ['Jan', 'Feb'],
  tabsStatus: 'ready',
  selectedTab: 'Jan',
  status: 'loaded',
  transactionCount: 12,
  skippedCount: 2,
  error: null,
  onSelectTab: vi.fn(),
  onRefresh: vi.fn(),
  onRetryTabs: vi.fn(),
};

const refreshButton = () => screen.getByRole('button', { name: 'Refresh' }) as HTMLButtonElement;

describe('SheetSourceBar', () => {
  afterEach(cleanup);

  it('shows the transaction and skipped-row summary and refreshes on click', async () => {
    const onRefresh = vi.fn();
    render(<SheetSourceBar {...base} onRefresh={onRefresh} />);
    expect(screen.getByText(/12 transactions/)).toBeTruthy();
    expect(screen.getByText(/2 rows skipped/)).toBeTruthy();
    await userEvent.click(refreshButton());
    expect(onRefresh).toHaveBeenCalled();
  });

  it('disables Refresh while loading and when no tab is selected', () => {
    const { rerender } = render(<SheetSourceBar {...base} status="loading" />);
    expect(refreshButton().disabled).toBe(true);
    rerender(<SheetSourceBar {...base} selectedTab={null} status="idle" transactionCount={0} />);
    expect(refreshButton().disabled).toBe(true);
    expect(screen.queryByText(/transactions/)).toBeNull();
  });

  it('disables the dropdown while the tab list loads', () => {
    render(<SheetSourceBar {...base} tabs={[]} tabsStatus="loading" selectedTab={null} status="idle" />);
    expect(screen.getByText('Loading tabs...')).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Sheet tab' }).hasAttribute('disabled')).toBe(true);
  });

  it('offers Retry when the tab list fails', async () => {
    const onRetryTabs = vi.fn();
    render(<SheetSourceBar {...base} tabsStatus="error" tabs={[]} selectedTab={null} onRetryTabs={onRetryTabs} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetryTabs).toHaveBeenCalled();
  });

  it('shows an inline read error', () => {
    render(<SheetSourceBar {...base} status="error" error="Sheet is busy" />);
    expect(screen.getByText('Sheet is busy')).toBeTruthy();
  });
});
