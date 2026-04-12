"use client";

import { useI18n } from "@/lib/i18n-context";
import { blogPosts } from "@/lib/blog-data";
import Navbar from "@/components/navbar";
import Link from "next/link";

export default function BlogPage() {
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t("blog.title")}</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t("blog.subtitle")}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-shqiponja/30 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-shqiponja/30"
            >
              <span className="text-4xl">{post.image}</span>
              <h2 className="mt-3 text-lg font-bold leading-tight group-hover:text-shqiponja transition-colors">
                {post.title[locale as "sq" | "en"]}
              </h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3">
                {post.excerpt[locale as "sq" | "en"]}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
                <span>
                  {new Date(post.date).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>·</span>
                <span>{post.readTime} min {locale === "sq" ? "lexim" : "read"}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
