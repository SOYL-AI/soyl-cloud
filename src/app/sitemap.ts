import { MetadataRoute } from "next";
import { competitors } from "@/lib/competitors";
import { blogPosts } from "@/lib/blog-data";
import { COMPANY } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `https://${COMPANY.domain}`;

  // Static routes
  const routes = [
    "",
    "/about",
    "/butler-ai",
    "/pms-lite",
    "/pricing",
    "/contact",
    "/compare",
    "/blog",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
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

  return [...routes, ...competitorRoutes, ...blogRoutes];
}
