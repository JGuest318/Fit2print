import type { BlogPost } from "@/lib/blog-posts";
import story from "@/content/stories/cody.json";

// Runtime schema validation runs before every build.
export const CODY_POST = story as BlogPost;
