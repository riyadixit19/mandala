// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Lato } from 'next/font/google';
import { siteMetadata, jsonLdData } from './metadata';
import { DayTheme } from './components/Stars';
import './globals.css';

// Lato, the typeface Khan Academy uses across its site
const lato = Lato({ subsets: ['latin'], weight: ['400', '700', '900'], variable: '--font-lato', display: 'swap' });

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: '#F4EFFF',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={lato.variable}>
      <body className="font-sans antialiased">
        <DayTheme />
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
