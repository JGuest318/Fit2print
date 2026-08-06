export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date string, e.g. "2026-08-06" */
  date: string;
  /** Each entry is one paragraph. */
  content: string[];
}

/**
 * BEHIND THE PRINT — post index
 *
 * To publish a new post: add a new object to the TOP of this array
 * (newest first). `slug` becomes the URL at /blog/<slug> — use lowercase
 * words separated by hyphens, no spaces or punctuation.
 *
 * Example:
 * {
 *   slug: "why-we-print-on-film-paper",
 *   title: "Why We Print on Film Paper",
 *   excerpt: "A short line that shows up on the blog index card.",
 *   date: "2026-09-01",
 *   content: [
 *     "First paragraph...",
 *     "Second paragraph...",
 *   ],
 * },
 */
export const BLOG_POSTS: BlogPost[] = [];
