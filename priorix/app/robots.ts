import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/browse"],
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/decks",
          "/decks/",
          "/notes",
          "/notes/",
          "/analytics",
          "/analytics/",
          "/todo",
          "/todo/",
          "/settings",
          "/settings/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
