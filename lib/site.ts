/**
 * The public identity of the site, in one place (PDL-079). The address is the production domain; set
 * NEXT_PUBLIC_SITE_URL to change it (a preview deployment, or a different domain later). Nothing else in the code names the
 * host: links inside the app are relative, the invite email uses the request's own origin, and PayPal's webhook address is
 * set in PayPal's dashboard.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://vbj.ai-studio.wiki").replace(/\/+$/, "");
export const SITE_NAME = "Vibe-Coding Journal";
export const SITE_TAGLINE = "Daily intelligence digest for vibe-coders";

/** The studio behind the product, as it is named in every public place and in the legal pages. */
export const STUDIO = {
  name: "Prompt Hero Studio",
  email: "ai-hero-studio@outlook.com",
  website: "https://mulalic.ai-studio.wiki/",
} as const;

/** Pages a search engine or a social network may fetch. Everything else needs an account. */
export const PUBLIC_PATHS = ["/", "/register", "/login", "/terms", "/privacy", "/refunds", "/subscription", "/cookies"] as const;
