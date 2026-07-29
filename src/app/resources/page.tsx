import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbSchema } from "@/components/seo/SchemaInjector";
import { Container } from "@/components/ui/Container";
import { SITE_URL } from "@/lib/constants";
import { RESOURCES } from "@/lib/resources";

export const metadata: Metadata = {
  title: "Resources for hotel operators",
  description:
    "Practical reference for running a hotel: cancellation policy clauses, the SOPs worth writing down, and what ADR, occupancy and RevPAR actually measure.",
  alternates: { canonical: `${SITE_URL}/resources` },
  openGraph: {
    title: "Resources for hotel operators — SOYL Cloud",
    description:
      "Practical reference for running a hotel. Written for the person on shift, not for search engines.",
    url: `${SITE_URL}/resources`,
  },
};

/**
 * The resources hub.
 *
 * A server component with no client JavaScript. It is a list of links, and a
 * list of links that needs hydrating is a list of links somebody over-built.
 */
export default function ResourcesPage() {
  const categories = ["Operations", "Revenue", "Templates"] as const;

  return (
    <main className="min-h-screen bg-white pb-24 pt-32">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: "/" },
          { name: "Resources", item: "/resources" },
        ]}
      />

      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] sm:text-4xl">
            Resources for hotel operators
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--color-soyl-gray-600)]">
            Reference material for the people running the property. Specific enough to
            act on, and written to be useful whether or not you ever use our software.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-12">
          {categories.map((category) => {
            const items = RESOURCES.filter((resource) => resource.category === category);
            if (!items.length) return null;

            return (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h2
                  id={`cat-${category}`}
                  className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-soyl-gray-500)]"
                >
                  {category}
                </h2>

                <ul className="space-y-4">
                  {items.map((resource) => (
                    <li key={resource.slug}>
                      <Link
                        href={`/resources/${resource.slug}`}
                        className="group block rounded-2xl border border-[var(--color-soyl-gray-200)] p-5 transition hover:border-[var(--color-soyl-gray-400)] hover:bg-[var(--color-soyl-gray-50)]"
                      >
                        <h3 className="text-lg font-semibold text-[var(--color-soyl-charcoal)]">
                          {resource.title}
                        </h3>
                        <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-soyl-gray-600)]">
                          {resource.description}
                        </p>
                        <p className="mt-3 text-xs text-[var(--color-soyl-gray-500)]">
                          {resource.readTime}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
