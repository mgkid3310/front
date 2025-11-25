import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unknown App - DM Demo',
  description: 'A demo of the DM chat feature for the Unknown App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
