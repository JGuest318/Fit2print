import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { EXTRA_BLOG_POSTS } from "@/lib/blog-posts-extra";

const ALL_BLOG_POSTS = [...EXTRA_BLOG_POSTS, ...BLOG_POSTS];

export const metadata: Metadata = {
  title: "Behind The Print | Fit 2 Print Blog",
  description:
    "Stories from behind the lens — process, craft, and the moments that shape every Fit 2 Print session.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Behind The Print | Fit 2 Print Blog",
    description:
      "Stories from behind the lens — process, craft, and the moments that shape every Fit 2 Print session.",
    url: "/blog",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Blog() {
  return (
    <main className="px-6 pb-24 pt-36">
      <div className="mx-auto max-w-3xl text-center">
        <p className="section-label mb-4">The Journal</p>
        <h1 className="hero-heading mb-6 text-4xl text-white md:text-6xl">Behind The Print</h1>
        <p className="mx-auto max-w-xl text-white/60">
          Stories from behind the lens &mdash; process, craft, and the moments that shape every
          session.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        {ALL_BLOG_POSTS.length === 0 ? (
          <div className="rounded-lg border border-white/10 px-6 py-16 text-center">
            <p className="text-white/60">
              New stories are on the way &mdash; check back soon.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/10">
            {ALL_BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group py-8 transition first:pt-0"
              >
                <p className="text-xs uppercase tracking-widest text-white/40">
                  {formatDate(post.date)}
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl uppercase text-white transition group-hover:text-[var(--accent)] md:text-3xl">
                  {post.title}
                </h2>
                <p className="mt-3 text-white/60">{post.excerpt}</p>
                <span className="mt-4 inline-block text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                  Read the story &rarr;
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
