import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — SOYL Cloud',
  description: 'Find answers to common questions about SOYL Cloud\'s AI hospitality platform, Butler AI, PMS Lite, pricing, implementation, and security.',
  openGraph: {
    title: 'Frequently Asked Questions — SOYL Cloud',
    description: 'Find answers to common questions about SOYL Cloud\'s AI hospitality platform, Butler AI, PMS Lite, pricing, implementation, and security.',
    url: 'https://soyl.cloud/faq',
    siteName: 'SOYL Cloud',
    type: 'website',
  },
  alternates: {
    canonical: 'https://soyl.cloud/faq',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
