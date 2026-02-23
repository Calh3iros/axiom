import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';

import { Analytics } from '@vercel/analytics/react';

import { CookieConsent } from '@/components/shared/cookie-consent';

import './globals.css';
import { routing } from '@/i18n/routing';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Axiom — AI Study Companion | Solve Homework in 5 Seconds',
  description: 'Snap a photo of any homework question and get step-by-step solutions instantly. Write essays, humanize AI text, and prepare for exams. Free to start, $9.99/mo for unlimited.',
  keywords: ['homework help', 'math solver', 'AI tutor', 'essay writer', 'AI humanizer', 'chegg alternative', 'study companion'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Axiom — Solve Any Homework in 5 Seconds',
    description: 'AI-powered study companion. Instant solutions, essay writing, text humanizer, and exam prep. Free to start.',
    type: 'website',
    siteName: 'Axiom',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Axiom — AI Study Companion',
    description: 'Solve homework, write essays, humanize AI text. Instant. Free to start.',
  },
  appleWebApp: {
    capable: true,
    title: 'Axiom',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090b',
};




export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${outfit.variable} dark`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[var(--color-bg0)]">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Analytics />
          <Toaster theme="dark" position="bottom-right" richColors />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
