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

/**
 * `Organization`, emitted once from the root layout.
 *
 * Sitewide rather than per page: it describes the company, not the document,
 * and repeating it on every route gives a crawler the same facts many times
 * with more chances to disagree with itself.
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    url: `https://${COMPANY.domain}`,
    logo: `https://${COMPANY.domain}/images/logo.png`,
    email: COMPANY.email,
    telephone: COMPANY.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
