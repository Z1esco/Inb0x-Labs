import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return process.env.VERCEL_ENV === "preview"
    ? []
    : [{ url: "https://inb0x.my/" }];
}
