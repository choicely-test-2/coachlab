import type { Metadata } from 'next';
import './globals.css';
import 'tachyons/css/tachyons.min.css';

export const metadata: Metadata = {
  title: 'CoachLab',
  description: 'Plan, share, and win. The ultimate coaching platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="sans-serif">{children}</body>
    </html>
  );
}
