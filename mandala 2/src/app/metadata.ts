// src/app/metadata.ts
// SEO metadata for Mandala. SITE_URL is the app's live domain.
import type { Metadata } from 'next';

export const SITE_URL = 'https://mandala.help';
const DESCRIPTION =
  'Mandala is a free yoga coach that runs in your browser. Pick a pose, hold it in front of your camera, and it tells you when your form is right, then times your hold.';

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Mandala - Yoga, one pose at a time',
    template: '%s | Mandala',
  },
  description: DESCRIPTION,
  keywords: ['yoga', 'yoga poses', 'yoga for kids', 'yoga trainer', 'pose detection', 'yoga at home', 'yoga for beginners'],
  applicationName: 'Mandala',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Mandala',
    title: 'Mandala - Yoga, one pose at a time',
    description: DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Mandala' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mandala - Yoga, one pose at a time',
    description: DESCRIPTION,
    images: ['/og-image.png'],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  // lets the app run full screen when added to a phone's home screen
  appleWebApp: { capable: true, title: 'Mandala', statusBarStyle: 'default' },
  alternates: { canonical: SITE_URL },
  category: 'Health & Fitness',
};

export const jsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Mandala',
  description: DESCRIPTION,
  url: SITE_URL,
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web Browser',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: ['61 yoga poses', 'Live form check with your camera', '15-second hold timer', 'Runs in the browser, video is not uploaded'],
  image: `${SITE_URL}/og-image.png`,
};
