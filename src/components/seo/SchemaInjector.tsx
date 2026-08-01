import React from "react";
import { COMPANY } from "@/lib/constants";

export function ProductSchema({
  name,
  description,
  image,
  category = "BusinessApplication",
}: {
  name: string;
  description: string;
  image?: string;
  category?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Product", "SoftwareApplication"],
    name,
    description,
    image: image || `https://${COMPANY.domain}/images/logo.png`,
    brand: {
      "@type": "Brand",
      name: COMPANY.name,
    },
    applicationCategory: category,
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebPageSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `https://${COMPANY.domain}${url}`,
    publisher: {
      "@type": "Organization",
      name: COMPANY.name,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; item: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://${COMPANY.domain}${item.item}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * `Article` for the resources library (`UPDATE.md` §10).
 *
 * `dateModified` is separate from `datePublished` and both are required rather
 * than optional: an operations reference that was accurate in 2026 and has not
 * been touched since is a different thing from one revised last month, and the
 * distinction is exactly what a reader — and a crawler — wants.
 */
export function ArticleSchema({
  headline,
  description,
  slug,
  published,
  modified,
  section,
}: {
  headline: string;
  description: string;
  /** Path, e.g. `/resources/hotel-sop-checklist`. */
  slug: string;
  published: string;
  modified: string;
  section: string;
}) {
  const url = `https://${COMPANY.domain}${slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    // Required for Google rich results — without it an article is not
    // eligible, which is most of the point of marking it up at all. This is
    // the generated OG card for the same route, so it always exists and always
    // matches the article.
    image: [`${url}/opengraph-image`],
    articleSection: section,
    datePublished: published,
    dateModified: modified,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: COMPANY.name, url: `https://${COMPANY.domain}` },
    publisher: {
      "@type": "Organization",
      name: COMPANY.name,
      logo: {
        "@type": "ImageObject",
        url: `https://${COMPANY.domain}/images/logo.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/*
 * There is deliberately no `OrganizationSchema` here.
 *
 * One was added during M5 and then removed: `app/layout.tsx` already emits an
 * Organization block, and a richer one — it carries `contactPoint`, `sameAs`
 * and a postal code. Two Organization blocks on the same page is not an error,
 * but it gives a crawler the same facts twice with two chances to disagree,
 * and the duplicate was the poorer of the two.
 *
 * If sitewide organisation data needs changing, change it in the layout.
 */
