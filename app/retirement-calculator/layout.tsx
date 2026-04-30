import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
});

export default function RetirementCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      style={{ fontFamily: 'var(--font-dm-sans, sans-serif)' }}
    >
      {children}
    </div>
  );
}
