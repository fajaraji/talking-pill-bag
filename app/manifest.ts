import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Talking Pill Bag",
    short_name: "Pill Bag",
    start_url: "/",
    display: "standalone",
    theme_color: "#0F766E",
    background_color: "#F8FAF9",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
