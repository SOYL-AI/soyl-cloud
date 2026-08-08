import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Hotel Advisor',
  description:
    'Have a conversation about your property and get a read on where your team loses time to documents. No account needed.',
  openGraph: {
    title: 'Hotel Advisor — SOYL Cloud',
    description:
      'Have a conversation about your property and get a read on where your team loses time to documents. No account needed.',
    url: `${SITE_URL}/advisor`,
    siteName: 'SOYL Cloud',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/advisor`,
  },
};

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
