import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { FinalCta } from "@/components/final-cta";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};

  const title = post.seoTitle ?? `${post.title} | Behind The Print`;
  const description = post.metaDescription ?? post.excerpt;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags,
    openGraph: {
      title,
      description,
      url: `/blog/${post.slug}`,
      images: post.image ? [{ url: post.image, alt: post.imageAlt ?? post.title }] : undefined,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Post `content` paragraphs support two lightweight editorial markers:
 *  - "## Heading text"  -> rendered as a gold, display-font subhead with a rule above it
 *  - "> Emphasis text"  -> rendered as a centered, gold pull-quote for a dramatic beat
 * Everything else renders as a normal body paragraph.
 */
function renderParagraph(paragraph: string, key: number) {
  if (paragraph.startsWith("## ")) {
    return (
      <h2 key={key} className="blog-subhead">
        {paragraph.slice(3)}
      </h2>
    );
  }

  if (paragraph.startsWith("> ")) {
    return (
      <p key={key} className="blog-pull">
        {paragraph.slice(2)}
      </p>
    );
  }

  return <p key={key}>{paragraph}</p>;
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <main className="px-6 pb-24 pt-36">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/blog"
          className="mb-10 inline-flex items-center gap-2 text-sm uppercase tracking-widest text-white/50 transition hover:text-[var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Behind The Print
        </Link>

        <p className="section-label mb-4">{formatDate(post.date)}</p>
        <h1 className="hero-heading mb-10 text-4xl text-white md:text-5xl">{post.title}</h1>

        {post.image && (
          <figure className="mb-10">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg md:aspect-[16/10]">
              <Image
                src={post.image}
                alt={post.imageAlt ?? post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            {post.imageCaption && (
              <figcaption className="mt-3 text-sm text-white/50">{post.imageCaption}</figcaption>
            )}
          </figure>
        )}

        <div className="space-y-6 text-base leading-relaxed text-white/70 md:text-lg">
          {post.content.map((paragraph, i) => renderParagraph(paragraph, i))}
        </div>

        {post.tags && (
          <div className="mt-12 flex flex-wrap gap-2 border-t border-white/10 pt-8">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <FinalCta />
    </main>
  );
}
