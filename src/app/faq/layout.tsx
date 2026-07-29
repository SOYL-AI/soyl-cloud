import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about SOYL Cloud\'s AI hospitality platform, Butler AI, PMS Lite, pricing, implementation, and security.',
  openGraph: {
    title: 'Frequently Asked Questions — SOYL Cloud',
    description: 'Find answers to common questions about SOYL Cloud\'s AI hospitality platform, Butler AI, PMS Lite, pricing, implementation, and security.',
    url: `${SITE_URL}/faq`,
    siteName: 'SOYL Cloud',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
