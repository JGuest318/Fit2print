import type { BlogPost } from "@/lib/blog-posts";
import { REBLUM_POST } from "@/lib/blog-post-reblum";
import { CODY_POST } from "@/lib/blog-post-cody";
import { CURRENT_BLOG_POSTS as BASELINE_POSTS } from "@/lib/blog-posts-current";

export const MERGED_BLOG_POSTS: BlogPost[] = [CODY_POST, REBLUM_POST, ...BASELINE_POSTS];
