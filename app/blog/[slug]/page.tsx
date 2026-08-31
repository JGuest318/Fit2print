import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BLOG_POSTS, type BlogContent } from "@/lib/blog-posts";
import { EXTRA_BLOG_POSTS } from "@/lib/blog-posts-extra";
import { FinalCta } from "@/components/final-cta";

const ALL_BLOG_POSTS = [...EXTRA_BLOG_POSTS, ...BLOG_POSTS];

export function generateStaticParams() {
  return ALL_BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = ALL_BLOG_POSTS.find((p) => p.slug === slug);
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
function renderInlineLinks(text: string) {
  return text.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g).map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (!match) return part;

    return (
      <a
        key={`${match[2]}-${index}`}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-[var(--accent)] underline decoration-white/20 underline-offset-4 transition hover:decoration-[var(--accent)]"
      >
        {match[1]}
      </a>
    );
  });
}

function renderParagraph(paragraph: BlogContent, key: number) {
  if (typeof paragraph !== "string") {
    const portrait = paragraph.height > paragraph.width;

    return (
      <figure key={key} className="my-10">
        <Image
          src={paragraph.src}
          alt={paragraph.alt}
          width={paragraph.width}
          height={paragraph.height}
          className={
            portrait
              ? "mx-auto h-auto max-h-[75vh] w-auto max-w-full rounded-lg"
              : "h-auto w-full rounded-lg"
          }
          sizes="(min-width: 768px) 672px, calc(100vw - 48px)"
        />
        {(paragraph.caption || paragraph.credit) && (
          <figcaption className="mt-3 text-sm text-white/50">
            {paragraph.caption && <span className="block">{paragraph.caption}</span>}
            {paragraph.credit && (
              <span className="mt-1 block text-xs text-white/35">{paragraph.credit}</span>
            )}
          </figcaption>
        )}
      </figure>
    );
  }

  if (paragraph.startsWith("## ")) {
    return (
      <h2 key={key} className="blog-subhead">
        {renderInlineLinks(paragraph.slice(3))}
      </h2>
    );
  }

  if (paragraph.startsWith("> ")) {
    return (
      <p key={key} className="blog-pull">
        {renderInlineLinks(paragraph.slice(2))}
      </p>
    );
  }

  return <p key={key}>{renderInlineLinks(paragraph)}</p>;
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = ALL_BLOG_POSTS.find((p) => p.slug === slug);
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
            {post.imageWidth && post.imageHeight ? (
              <Image
                src={post.image}
                alt={post.imageAlt ?? post.title}
                width={post.imageWidth}
                height={post.imageHeight}
                className="h-auto w-full rounded-lg"
                priority
                sizes="(min-width: 768px) 672px, calc(100vw - 48px)"
              />
            ) : (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg md:aspect-[16/10]">
                <Image
                  src={post.image}
                  alt={post.imageAlt ?? post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            {(post.imageCaption || post.imageCredit) && (
              <figcaption className="mt-3 text-sm text-white/50">
                {post.imageCaption && <span className="block">{post.imageCaption}</span>}
                {post.imageCredit && (
                  <span className="mt-1 block text-xs text-white/35">{post.imageCredit}</span>
                )}
              </figcaption>
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
