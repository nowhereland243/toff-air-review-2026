import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ToFF Artist Residency Review 2026',
  description: 'Private review portal for Tom of Finland Foundation Artist-in-Residence applications.',
  robots: {
    index: false,
    follow: false,
  },
};

import { PersistentReminderBanner } from '@/components/PersistentReminderBanner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        {children}
        <PersistentReminderBanner />
      </body>
    </html>
  );
}
