// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Lexend } from 'next/font/google';
import { siteMetadata, jsonLdData } from './metadata';
import './globals.css';

// Lexend was designed to make reading easier, which suits young readers
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend', display: 'swap' });

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: '#F1ECE2',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={lexend.variable}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
          suppressHydrationWarning
        />

        {/* Google AdSense (kept from the original project) */}
        <Script
          id="adsense-script"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-9371236961473989'}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {children}
      </body>
    </html>
  );
}
