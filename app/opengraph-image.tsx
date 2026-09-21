import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE, STUDIO } from "@/lib/site";

// The picture Facebook, LinkedIn and messengers show when the link is shared (1200 x 630).
export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          color: "#000000",
          padding: 72,
          borderLeft: "24px solid #ff3000",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "#ff3000", fontWeight: 700 }}>
          Daily intelligence for vibe-coders
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 128, fontWeight: 900, lineHeight: 1, letterSpacing: -4 }}>{SITE_NAME}</div>
          <div style={{ display: "flex", fontSize: 40, marginTop: 28, color: "#2a2a2a" }}>
            Your daily edge in the AI coding revolution. Plus a University, a Prompt School and a Dictionary.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#444444" }}>{STUDIO.name}</div>
      </div>
    ),
    size,
  );
}
