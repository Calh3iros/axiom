import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Axiom - The ultimate AI study companion',
  description: 'Solve homework, write essays, and learn anything instantly.',
  manifest: '/manifest.json',
  themeColor: '#08090b',
  appleWebApp: {
    capable: true,
    title: 'Axiom',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} dark`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[var(--color-bg0)]">{children}</body>
    </html>
  );
}
