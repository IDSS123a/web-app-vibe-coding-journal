/**
 * Formats a UTC timestamp for public display in the product's public-facing
 * timezone (Europe/London — the intended value, safe to hardcode here).
 *
 * Uses Intl.DateTimeFormat's real IANA timezone data so the GMT/BST label
 * and offset switch automatically across the DST boundary — no manual
 * adjustment, ever, regardless of what timezone the report was actually
 * generated in.
 */

const PUBLIC_DISPLAY_TIMEZONE = "Europe/London";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: PUBLIC_DISPLAY_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZoneName: "short",
});

export function formatPublicTimestamp(isoTimestamp: string): string {
  return formatter.format(new Date(isoTimestamp));
}
