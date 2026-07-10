import { MetadataRoute } from "next";
import { COMPANY } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"],
    },
    sitemap: `https://${COMPANY.domain}/sitemap.xml`,
  };
}
