import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { ComparisonCard } from "@/components/compare/ComparisonCard";
import { Breadcrumb } from "@/components/compare/Breadcrumb";
import { competitors } from "@/lib/competitors";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Compare Butler AI — Hospitality AI Platform Comparisons",
  description: "Compare Butler AI with the world's leading hospitality AI platforms and discover which solution best fits your hotel's needs.",
  openGraph: {
    title: "Compare Butler AI — Hospitality AI Platform Comparisons",
    description: "Compare Butler AI with the world's leading hospitality AI platforms and discover which solution best fits your hotel.",
    url: `https://${COMPANY.domain}/compare`,
    type: "website",
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/compare`,
  },
};

export default function CompareHubPage() {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Compare Butler AI with Competitors",
    description: "A comprehensive hub comparing Butler AI against leading hospitality AI platforms.",
    url: `https://${COMPANY.domain}/compare`,
    hasPart: competitors.map(c => ({
      "@type": "WebPage",
      name: `Butler AI vs ${c.name}`,
      url: `https://${COMPANY.domain}/compare/${c.slug}`
    }))
  };

  return (
    <div className="pt-32 pb-0 flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      
      <Container className="mb-8">
        <Breadcrumb items={[{ label: "Compare Butler AI" }]} />
      </Container>

      <Container className="mb-20">
        <SectionHeader
          as="h1"
          badge="Comparisons"
          title="Butler AI Comparisons"
          description="Compare Butler AI with the world's leading hospitality AI platforms and discover which solution best fits your hotel."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitors.map((competitor) => (
            <ComparisonCard key={competitor.slug} competitor={competitor} />
          ))}
        </div>
      </Container>

      <FinalCTA />
    </div>
  );
}
