'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun, iconKey: 'sun' },
  { value: 'dark', label: 'Dark', Icon: Moon, iconKey: 'moon' },
  { value: 'system', label: 'System', Icon: Monitor, iconKey: 'monitor' },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid SSR/client mismatch: next-themes returns undefined theme on the server.
  // Only render the resolved icon after the component has mounted on the client.
  useEffect(() => setMounted(true), []);

  const current = THEME_OPTIONS.find(o => o.value === theme) ?? THEME_OPTIONS[2];
  const { Icon } = current;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Switch theme" />}
      >
        {/* Render a stable placeholder until mounted to prevent hydration mismatch */}
        {mounted
          ? <Icon className="h-4 w-4" data-icon={current.iconKey} />
          : <Monitor className="h-4 w-4" data-icon="monitor" />
        }
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map(({ value, label, Icon: OptionIcon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
            <OptionIcon className="h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
