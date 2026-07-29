import { MetadataRoute } from "next";
import { competitors } from "@/lib/competitors";
import { RESOURCES } from "@/lib/resources";
import { blogPosts } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;

  // Static routes
  // Core pages
  const routes = [
    "",
    "/about",
    "/products/butler-ai",
    "/products/pms-lite",
    "/products/soyl-dine",
    "/pricing",
    "/contact",
    "/compare",
    "/blog",
    "/book-demo",
    "/faq",
    "/resources",
    // The Hotel Advisor is a real entry point, not a utility page: it is the
    // one route where someone can use the product before talking to anyone.
    "/advisor",
  ].map((route) => ({
    // `route` is "" for the home page, giving the bare origin — which is what
    // Next resolves the home page's canonical to. `scripts/canonical.test.mts`
    // asserts the two agree.
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority:
      route === ""
        ? 1
        : route === "/book-demo" || route === "/advisor"
          ? 0.9
          : 0.8,
  }));

  // Legal and Trust pages (lower priority, less frequent changes)
  // `/privacy` and `/terms` moved under `/legal/*` and now 308 to it. A
  // sitemap must list the destination, never the redirect — listing a
  // redirecting URL asks a crawler to spend budget discovering what we already
  // know.
  const legalRoutes = [
    "/legal/privacy",
    "/legal/terms",
    "/legal/dpa",
    "/security",
    "/company",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.3,
  }));

  // Dynamic Competitor Comparison Routes
  const competitorRoutes = competitors.map((c) => ({
    url: `${baseUrl}/compare/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9, // High priority for SEO hubs
  }));

  // The resources library — §10's SEO engine. Weekly rather than daily: these
  // are operational reference that changes when the practice changes, and
  // claiming daily freshness for a document nobody edited is a signal a
  // crawler learns to discount.
  const resourceRoutes = RESOURCES.map((resource) => ({
    url: `${baseUrl}/resources/${resource.slug}`,
    lastModified: new Date(resource.updated),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamic Blog Routes
  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedDate),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...routes, ...legalRoutes, ...resourceRoutes, ...competitorRoutes, ...blogRoutes];
}
