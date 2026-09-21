import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Only the public pages are for search engines; every other page shows nothing without an account.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard", "/archive", "/bookmarks", "/assistant", "/university", "/dictionary", "/prompt-school", "/badges", "/certificates", "/account", "/verify/", "/welcome", "/set-password", "/forgot-password"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
