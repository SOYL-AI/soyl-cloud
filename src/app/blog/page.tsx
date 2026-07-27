import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Breadcrumb } from "@/components/compare/Breadcrumb";
import { blogPosts } from "@/lib/blog-data";
import { COMPANY } from "@/lib/constants";
import { Clock, CalendarDays, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Hospitality AI Blog | SOYL Cloud",
  description: "Insights, guides, and trends on artificial intelligence, guest experience, and hotel operations.",
  openGraph: {
    title: "Hospitality AI Blog | SOYL Cloud",
    description: "Insights, guides, and trends on artificial intelligence, guest experience, and hotel operations.",
    url: `https://${COMPANY.domain}/blog`,
    type: "website",
  },
  alternates: {
    canonical: `https://${COMPANY.domain}/blog`,
  },
};

export default function BlogHubPage() {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "SOYL Cloud Blog",
    description: "Insights on hospitality AI.",
    url: `https://${COMPANY.domain}/blog`,
    blogPost: blogPosts.map(post => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `https://${COMPANY.domain}/blog/${post.slug}`,
      datePublished: post.publishedDate
    }))
  };

  return (
    <div className="pt-32 pb-0 flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      
      <Container className="mb-8">
        <Breadcrumb items={[{ label: "Blog" }]} />
      </Container>

      <Container className="mb-20">
        <SectionHeader
          as="h1"
          badge="Blog"
          title="SOYL Cloud Blog"
          description="Insights, guides, and trends on artificial intelligence, guest experience, and hotel operations."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
              <article className="h-full bg-white rounded-2xl border border-[var(--color-soyl-gray-200)] shadow-sm hover:shadow-xl hover:border-[var(--color-soyl-mint)]/50 transition-all duration-300 flex flex-col overflow-hidden">
                <div className="relative w-full h-48 bg-[var(--color-soyl-gray-100)] border-b border-[var(--color-soyl-gray-200)] overflow-hidden">
                  {post.heroImage && (
                    <Image src={post.heroImage} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs font-medium text-[var(--color-soyl-gray-500)] mb-4">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <time dateTime={post.publishedDate}>
                      {new Date(post.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </time>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-[var(--color-soyl-charcoal)] mb-3 group-hover:text-[var(--color-soyl-mint-dark)] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-sm text-[var(--color-soyl-gray-600)] leading-relaxed mb-6 flex-1 line-clamp-3">
                  {post.description}
                </p>

                <div className="flex items-center text-sm font-semibold text-[var(--color-soyl-charcoal)] group-hover:text-[var(--color-soyl-mint-dark)] transition-colors mt-auto pt-4 border-t border-[var(--color-soyl-gray-100)]">
                  Read Article
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </Container>

      <FinalCTA />
    </div>
  );
}
