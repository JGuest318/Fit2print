import { BLOG_POSTS, type BlogPost } from "@/lib/blog-posts";
import { EXTRA_BLOG_POSTS } from "@/lib/blog-posts-extra";
import { MERGED_BLOG_POSTS } from "@/lib/blog-posts-current-merged";

type Listing = Pick<BlogPost, "slug" | "title" | "excerpt" | "date">;
export type Story = { kind: "story"; post: BlogPost } | { kind: "static"; post: Listing };

const HINKS_POST = {
  slug: "hinks-smokehouse-from-folding-table-to-food-truck",
  title: "Hink’s Smokehouse: From Folding Table to Food Truck",
  excerpt:
    "A familiar Farmers’ Market neighbor grows from bottles on a folding table to a full food truck — a small story about consistency, hard work, and recognizing growth around us.",
  date: "2026-09-08",
};


// Preserve legacy sitemap order; the index sorts a copy by date.
export function getStories(): Story[] {
  return [
    { kind: "static", post: HINKS_POST },
    ...[...MERGED_BLOG_POSTS, ...EXTRA_BLOG_POSTS, ...BLOG_POSTS]
      .map((post): Story => ({ kind: "story", post })),
  ];
}
export function getStoryPosts(): BlogPost[] {
  return getStories().flatMap(entry => entry.kind === "story" ? [entry.post] : []);
}
