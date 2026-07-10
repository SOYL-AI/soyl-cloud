import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { ComparisonTable } from "@/components/compare/ComparisonTable";
import { VerdictBox } from "@/components/compare/VerdictBox";
import { BestForCards } from "@/components/compare/BestForCards";
import { FAQSection } from "@/components/compare/FAQSection";
import { Breadcrumb } from "@/components/compare/Breadcrumb";
import { WhyButlerAI } from "@/components/compare/WhyButlerAI";
import { CrossLinks } from "@/components/compare/CrossLinks";
import { competitors } from "@/lib/competitors";
import { COMPANY } from "@/lib/constants";

export async function generateStaticParams() {
  return competitors.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const competitor = competitors.find((c) => c.slug === slug);

  if (!competitor) {
    return {
      title: "Comparison Not Found | SOYL Cloud",
    };
  }

  const title = `Butler AI vs ${competitor.name} — Feature Comparison`;
  const description = `Compare Butler AI and ${competitor.name}. See a detailed feature-by-feature breakdown of guest messaging, operations routing, and pricing models.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://${COMPANY.domain}/compare/${slug}`,
      type: "article",
    },
    alternates: {
      canonical: `https://${COMPANY.domain}/compare/${slug}`,
    },
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competitor = competitors.find((c) => c.slug === slug);

  if (!competitor) {
    notFound();
  }

  // Schema.org Product markup for Butler AI
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: "Butler AI",
    image: `https://${COMPANY.domain}/images/logo.png`,
    description: "AI-powered hotel concierge resolving guest requests in under 30 seconds.",
    brand: {
      "@type": "Brand",
      name: "SOYL Cloud"
    }
  };

  return (
    <div className="pt-32 pb-0 flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      
      <Container className="mb-8">
        <Breadcrumb 
          items={[
            { label: "Compare Butler AI", href: "/compare" },
            { label: `vs ${competitor.name}` }
          ]} 
        />
      </Container>

      {/* Hero Section */}
      <section className="mb-16">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
              Butler AI vs <span className="text-[var(--color-soyl-mint-dark)]">{competitor.name}</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--color-soyl-gray-600)] mb-10 leading-relaxed max-w-3xl mx-auto">
              Compare features, guest experience, integrations, and deployment options to find the best hospitality AI platform for your property.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="primary" href="/book-demo" className="w-full sm:w-auto">
                Book a Demo
              </Button>
              <Button size="lg" variant="outline" href="#product-tour" className="w-full sm:w-auto">
                Watch Product Tour
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Verdict Section */}
      <section className="mb-20">
        <Container className="max-w-5xl">
          <VerdictBox 
            competitorName={competitor.name}
            competitorStrength={competitor.verdict.competitorStrength}
            butlerStrength={competitor.verdict.butlerStrength}
          />
        </Container>
      </section>

      {/* Comparison Table Section */}
      <section className="mb-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-4">
              Feature-by-Feature Breakdown
            </h2>
            <p className="text-[var(--color-soyl-gray-600)]">
              An objective look at how Butler AI stacks up against {competitor.name} across core hospitality technology categories.
            </p>
          </div>
          <ComparisonTable 
            categories={competitor.features} 
            competitorName={competitor.name} 
          />
        </Container>
      </section>

      {/* Best For Section */}
      <section className="mb-24 bg-[var(--color-soyl-gray-50)] py-20 border-y border-[var(--color-soyl-gray-100)]">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-4">
              Who is each platform best for?
            </h2>
          </div>
          <BestForCards bestFor={competitor.bestFor} />
        </Container>
      </section>

      {/* Why Butler AI Section */}
      <section className="mb-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-4">
              Why Hotels Choose Butler AI
            </h2>
            <p className="text-[var(--color-soyl-gray-600)]">
              The modern standard for hospitality automation.
            </p>
          </div>
          <WhyButlerAI />
        </Container>
      </section>

      {/* FAQs Section */}
      <section className="mb-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <FAQSection faqs={competitor.faqs} />
        </Container>
      </section>

      {/* Cross Links Section */}
      <section className="mb-24">
        <Container>
          <CrossLinks currentCompetitorSlug={competitor.slug} />
        </Container>
      </section>

      <FinalCTA />
    </div>
  );
}
