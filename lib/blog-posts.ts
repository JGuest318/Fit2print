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
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "the-photograph-that-time-will-choose",
    title: "The Photograph That Time Will Choose",
    excerpt:
      "No photographer presses the shutter with certainty — but every image deserves the craftsmanship worthy of an unknown future.",
    date: "2026-08-07",
    content: [
      "No photographer presses the shutter with the certainty that this will be the image future generations refuse to let fade.",
      "History never identifies its favorites in advance.",
      "The photograph destined to outlive us rarely announces its importance the day it is created.",
      "More often, it slips quietly into existence unnoticed. It is the unguarded laughter around the dinner table, a father’s weathered hands resting on a child’s shoulder, a mother’s comforting embrace, the gap-toothed grin that disappears before anyone realizes how fleeting it was, or two grandparents sharing an ordinary afternoon that seemed too commonplace to matter.",
      "Yet time possesses an extraordinary gift.",
      "It elevates the familiar into something irreplaceable.",
      "The image overlooked today may become the one your children safeguard with quiet devotion. The framed portrait you pass without a second glance may someday inspire your grandchildren to ask, “Who were they?” A weathered album tucked away on a bookshelf may eventually become the final refuge for a smile, an expression, or a face that no longer exists anywhere else.",
      "None of us can foresee which frame will carry that burden.",
      "That uncertainty is precisely why every photograph deserves unwavering intention.",
      "Every exposure deserves patience.",
      "Every finished image deserves craftsmanship worthy of its unknown future.",
      "Not because each photograph belongs beneath gallery lights, but because any single frame may one day shoulder the weight of a family’s story. Long after names have faded from memory, photographs often become the bridge that reconnects generations separated by decades.",
      "As photographers, we are never granted the luxury of deciding which images will matter half a century from now. That judgment belongs to time alone. Our calling is far simpler—and far more demanding.",
      "We create every photograph as though it could become someone’s most treasured possession.",
      "That conviction is the heartbeat of Photography Fit 2 Print.",
      "It is more than a business name. It is a promise. A promise that every photograph leaving the studio has been crafted with the respect future memories deserve. Images intended not merely to exist on a screen, but to live on walls, rest in albums, pass through careful hands, and be rediscovered by people we will never meet.",
      "Because heirlooms are not born the moment the shutter closes.",
      "They earn that distinction one generation at a time—through remembrance, through preservation, and through the enduring affection of those who refuse to let the story disappear.",
    ],
  },
];
