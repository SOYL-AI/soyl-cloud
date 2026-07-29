import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleSchema, BreadcrumbSchema } from "@/components/seo/SchemaInjector";
import { Container } from "@/components/ui/Container";
import { SITE_URL } from "@/lib/constants";
import { RESOURCES, getResource, type ResourceBlock } from "@/lib/resources";

/**
 * One resource article.
 *
 * Statically generated from `generateStaticParams`, server-rendered, and with
 * no client JavaScript at all — it is prose. `UPDATE.md` §10: marketing routes
 * are RSC with no client-side data fetching for primary content.
 */

export function generateStaticParams() {
  return RESOURCES.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) return {};

  const url = `${SITE_URL}/resources/${resource.slug}`;

  return {
    title: resource.title,
    description: resource.description,
    alternates: { canonical: url },
    openGraph: {
      title: resource.title,
      description: resource.description,
      url,
      type: "article",
      publishedTime: resource.published,
      modifiedTime: resource.updated,
    },
  };
}

function Block({ block }: { block: ResourceBlock }) {
  switch (block.kind) {
    case "heading":
      return (
        <h2 className="mt-12 text-xl font-semibold text-[var(--color-soyl-charcoal)] sm:text-2xl">
          {block.text}
        </h2>
      );

    case "para":
      return (
        <p className="mt-4 text-[16px] leading-[1.75] text-[var(--color-soyl-gray-600)]">
          {block.text}
        </p>
      );

    case "list":
      return (
        <ul className="mt-4 space-y-2.5">
          {block.items.map((item) => (
            <li
              key={item}
              className="flex gap-3 text-[16px] leading-[1.7] text-[var(--color-soyl-gray-600)]"
            >
              <span
                className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-soyl-mint-dark)]"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      );

    case "ordered":
      return (
        <ol className="mt-4 space-y-2.5">
          {block.items.map((item, index) => (
            <li
              key={item}
              className="flex gap-3 text-[16px] leading-[1.7] text-[var(--color-soyl-gray-600)]"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-soyl-gray-100)] text-xs font-semibold text-[var(--color-soyl-charcoal)]">
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      );

    case "note":
      return (
        <aside className="mt-6 rounded-2xl border border-[var(--color-soyl-mint-dark)]/25 bg-[var(--color-soyl-mint-light)]/40 p-5">
          <p className="text-[15px] leading-[1.7] text-[var(--color-soyl-charcoal)]">
            {block.text}
          </p>
        </aside>
      );

    case "table":
      return (
        // Scrolls inside its own container rather than widening the page. A
        // three-column table on a 375px screen has to go somewhere, and the
        // body scrolling sideways is the wrong answer.
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-soyl-gray-200)]">
                {block.headers.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="py-2.5 pr-4 font-semibold text-[var(--color-soyl-charcoal)]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr
                  key={row.join("|")}
                  className="border-b border-[var(--color-soyl-gray-100)] align-top"
                >
                  {row.map((cell, index) => (
                    <td
                      key={index}
                      className={`py-3 pr-4 text-[var(--color-soyl-gray-600)] ${
                        index === 0 ? "font-medium text-[var(--color-soyl-charcoal)]" : ""
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default async function ResourceArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  return (
    <main className="min-h-screen bg-white pb-24 pt-32">
      <ArticleSchema
        headline={resource.title}
        description={resource.description}
        slug={`/resources/${resource.slug}`}
        published={resource.published}
        modified={resource.updated}
        section={resource.category}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", item: "/" },
          { name: "Resources", item: "/resources" },
          { name: resource.title, item: `/resources/${resource.slug}` },
        ]}
      />

      <Container>
        <article className="mx-auto max-w-2xl">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <Link
              href="/resources"
              className="text-[var(--color-soyl-gray-500)] underline hover:text-[var(--color-soyl-charcoal)]"
            >
              Resources
            </Link>
            <span className="mx-2 text-[var(--color-soyl-gray-400)]">›</span>
            <span className="text-[var(--color-soyl-gray-600)]">{resource.category}</span>
          </nav>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--color-soyl-charcoal)] sm:text-4xl">
            {resource.title}
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-[var(--color-soyl-gray-600)]">
            {resource.intro}
          </p>

          <p className="mt-5 text-xs text-[var(--color-soyl-gray-500)]">
            {resource.readTime}
            <span className="mx-2">·</span>
            <time dateTime={resource.updated}>
              Updated{" "}
              {new Date(resource.updated).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </p>

          <div className="mt-4">
            {resource.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </div>

          {/* Internal links with descriptive anchors, per §10. The anchor text
              says what is on the other side rather than "learn more", which is
              both better for a screen reader and the only kind of internal link
              worth having. */}
          <div className="mt-14 border-t border-[var(--color-soyl-gray-200)] pt-6">
            <h2 className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">
              Next
            </h2>
            <ul className="mt-3 space-y-2">
              {resource.related.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[15px] text-[var(--color-soyl-gray-600)] underline underline-offset-2 hover:text-[var(--color-soyl-charcoal)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </Container>
    </main>
  );
}
