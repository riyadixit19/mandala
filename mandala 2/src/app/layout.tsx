// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Figtree, Instrument_Serif } from 'next/font/google';
import { siteMetadata, jsonLdData } from './metadata';
import './globals.css';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: '#F3F4F0',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${instrumentSerif.variable}`}>
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
