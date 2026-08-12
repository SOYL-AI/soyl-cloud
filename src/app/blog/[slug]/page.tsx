import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Breadcrumb } from "@/components/compare/Breadcrumb";
import { blogPosts } from "@/lib/blog-data";
import { competitors } from "@/lib/competitors";
import { COMPANY } from "@/lib/constants";
import { Clock, CalendarDays, ChevronRight, Sparkles } from "lucide-react";

export async function generateStaticParams() {
  return blogPosts.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Article Not Found | SOYL Cloud",
    };
  }

  return {
    title: `${post.title} | SOYL Cloud Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://${COMPANY.domain}/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedDate,
    },
    alternates: {
      canonical: `https://${COMPANY.domain}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  // Generate Article Schema for SEO
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedDate,
    author: {
      "@type": "Organization",
      name: "SOYL Cloud",
      url: `https://${COMPANY.domain}`
    },
    publisher: {
      "@type": "Organization",
      name: "SOYL Cloud",
      logo: {
        "@type": "ImageObject",
        url: `https://${COMPANY.domain}/images/logo.png`
      }
    }
  };

  const relatedComps = competitors.filter(c => post.relatedComparisons.includes(c.slug));

  return (
    <div className="pt-32 pb-0 flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      
      <Container className="mb-8">
        <Breadcrumb 
          items={[
            { label: "Blog", href: "/blog" },
            { label: post.title }
          ]} 
        />
      </Container>

      <Container className="mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <article>
              <header className="mb-10 pb-10 border-b border-[var(--color-soyl-gray-200)]">
                <div className="flex items-center gap-4 text-sm font-medium text-[var(--color-soyl-gray-500)] mb-6">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" />
                    <time dateTime={post.publishedDate}>
                      {new Date(post.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </time>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6 leading-tight">
                  {post.title}
                </h1>
                <p className="text-lg md:text-xl text-[var(--color-soyl-gray-600)] leading-relaxed">
                  {post.description}
                </p>
              </header>

              {/* AEO Direct Answer Block */}
              {post.aeoAnswer && (
                <div className="mb-10 bg-[var(--color-soyl-mint-light)] rounded-2xl p-6 border border-[var(--color-soyl-mint)]/30 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 p-4 opacity-10 pointer-events-none">
                    <Sparkles className="w-32 h-32 text-[var(--color-soyl-mint-dark)]" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-[var(--color-soyl-mint-dark)]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--color-soyl-mint-dark)] mb-2">Quick Answer</h3>
                      <p className="text-[17px] font-medium text-slate-800 leading-relaxed text-balance">
                        {post.aeoAnswer}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {post.heroImage && (
                <div className="relative w-full h-[300px] md:h-[500px] rounded-3xl overflow-hidden mb-12 shadow-xl border border-[var(--color-soyl-gray-200)]">
                  <Image src={post.heroImage} alt={post.title} fill className="object-cover" priority />
                </div>
              )}

              <div className="prose prose-lg prose-gray max-w-none">
                {post.sections.map((section, idx) => (
                  <section key={idx} className="mb-10">
                    <h2 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-4 mt-8">
                      {section.heading}
                    </h2>
                    {section.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className="text-base md:text-lg text-[var(--color-soyl-gray-600)] leading-relaxed mb-4">
                        {p}
                      </p>
                    ))}
                  </section>
                ))}
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {relatedComps.length > 0 && (
              <div className="bg-[var(--color-soyl-gray-50)] rounded-2xl p-6 border border-[var(--color-soyl-gray-200)]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-soyl-charcoal)] mb-4">
                  Compare Alternatives
                </h3>
                <div className="space-y-3">
                  {relatedComps.map(comp => (
                    <Link
                      key={comp.slug}
                      href={`/compare/${comp.slug}`}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-[var(--color-soyl-gray-200)] hover:border-[var(--color-soyl-mint)] hover:shadow-sm transition-all group"
                    >
                      <span className="text-sm font-medium text-[var(--color-soyl-gray-600)] group-hover:text-[var(--color-soyl-charcoal)]">
                        Butler AI vs {comp.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--color-soyl-gray-400)] group-hover:text-[var(--color-soyl-mint)]" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {post.relatedProducts.length > 0 && (
              <div className="bg-[var(--color-soyl-mint-light)] rounded-2xl p-6 border border-[var(--color-soyl-mint)]/20">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-soyl-mint-dark)] mb-4">
                  Explore Solutions
                </h3>
                <div className="space-y-3">
                  {post.relatedProducts.map((prod, idx) => (
                    <Link
                      key={idx}
                      href={prod.href}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-[var(--color-soyl-mint)]/20 hover:border-[var(--color-soyl-mint)] hover:shadow-sm transition-all group"
                    >
                      <span className="text-sm font-medium text-[var(--color-soyl-charcoal)] group-hover:text-[var(--color-soyl-mint-dark)]">
                        {prod.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--color-soyl-mint)]" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </Container>

      <FinalCTA />
    </div>
  );
}
