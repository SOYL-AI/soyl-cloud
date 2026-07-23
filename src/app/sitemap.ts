import { MetadataRoute } from "next";
import { competitors } from "@/lib/competitors";
import { blogPosts } from "@/lib/blog-data";
import { COMPANY } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${COMPANY.domain}`;

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
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : route === "/book-demo" ? 0.9 : 0.8,
  }));

  // Legal and Trust pages (lower priority, less frequent changes)
  const legalRoutes = ["/privacy", "/terms", "/security", "/company"].map((route) => ({
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

  // Dynamic Blog Routes
  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedDate),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...routes, ...legalRoutes, ...competitorRoutes, ...blogRoutes];
}
