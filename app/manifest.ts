import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RacketTier – Every Smash Counts",
    short_name: "RacketTier",
    description:
      "RacketTier is a sports performance platform where every match matters. Track your rankings, match history, and detailed stats across the world of racket sports.",
    start_url: "/",
    display: "fullscreen",
    background_color: "#fafafa",
    theme_color: "#f4f4f5",
    icons: [
      {
        src: "/images/racketTier-logo-v1.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
