import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { FinalCta } from "@/components/final-cta";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | Behind The Print`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} | Behind The Print`,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
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

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
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

        <div className="space-y-6 text-base leading-relaxed text-white/70 md:text-lg">
          {post.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>

      <FinalCta />
    </main>
  );
}
