import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { EXTRA_BLOG_POSTS } from "@/lib/blog-posts-extra";
import { CURRENT_BLOG_POSTS } from "@/lib/blog-posts-current";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${SITE.domain}`;
  const routes = ["", "/portfolio", "/services", "/prints", "/about", "/blog", "/contact"];

  const staticEntries = routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const hinksEntry = {
    url: `${base}/blog/hinks-smokehouse-from-folding-table-to-food-truck`,
    lastModified: new Date("2026-09-08"),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  };

  const postEntries = [...CURRENT_BLOG_POSTS, ...EXTRA_BLOG_POSTS, ...BLOG_POSTS].map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, hinksEntry, ...postEntries];
}
