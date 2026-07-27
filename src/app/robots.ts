import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The authenticated area and every auth surface. Nothing here is
      // useful in a search result and some of it carries tokens in query
      // strings.
      disallow: ["/api/", "/admin/", "/app", "/login", "/signup", "/verify-email", "/reset-password", "/forgot-password", "/onboarding"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
