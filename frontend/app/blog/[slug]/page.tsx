"use client";

import { useI18n } from "@/lib/i18n-context";
import { getBlogPost, blogPosts } from "@/lib/blog-data";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const post = getBlogPost(slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
          <span className="text-6xl">📝</span>
          <h1 className="mt-4 text-2xl font-extrabold">{t("blog.notFound")}</h1>
          <Link
            href="/blog"
            className="mt-6 inline-block rounded-full bg-shqiponja px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-shqiponja/25 hover:bg-shqiponja-dark transition"
          >
            {t("blog.backToBlog")}
          </Link>
        </div>
      </div>
    );
  }

  const lang = locale as "sq" | "en";
  const content = post.content[lang];

  // Simple markdown-like rendering: ## headings, **bold**, - lists
  const renderContent = (text: string) => {
    return text.split("\n\n").map((block, i) => {
      if (block.startsWith("## ")) {
        return (
          <h2 key={i} className="mt-8 mb-3 text-xl font-bold">
            {block.slice(3)}
          </h2>
        );
      }
      // List items
      if (block.includes("\n- ")) {
        const items = block.split("\n").filter((l) => l.startsWith("- "));
        return (
          <ul key={i} className="mt-2 space-y-2">
            {items.map((item, j) => (
              <li key={j} className="flex gap-2 text-zinc-700 dark:text-zinc-300">
                <span className="mt-1 text-shqiponja">•</span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: item.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              </li>
            ))}
          </ul>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(block.split("\n")[0])) {
        const items = block.split("\n").filter((l) => /^\d+\.\s/.test(l));
        return (
          <ol key={i} className="mt-2 space-y-2 list-decimal list-inside">
            {items.map((item, j) => (
              <li key={j} className="text-zinc-700 dark:text-zinc-300">
                {item.replace(/^\d+\.\s/, "")}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <p key={i} className="mt-3 text-zinc-700 leading-relaxed dark:text-zinc-300">
          {block}
        </p>
      );
    });
  };

  // Related posts (exclude current)
  const related = blogPosts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center text-sm font-medium text-zinc-500 transition hover:text-shqiponja dark:text-zinc-400"
        >
          ← {t("blog.backToBlog")}
        </Link>

        <span className="text-5xl">{post.image}</span>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl leading-tight">
          {post.title[lang]}
        </h1>

        <div className="mt-3 flex items-center gap-3 text-sm text-zinc-400">
          <span>
            {new Date(post.date).toLocaleDateString(locale === "sq" ? "sq-AL" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span>·</span>
          <span>{post.readTime} min {locale === "sq" ? "lexim" : "read"}</span>
        </div>

        <div className="mt-8 prose-base">{renderContent(content)}</div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl bg-shqiponja/5 border border-shqiponja/20 p-6 text-center dark:bg-shqiponja/10">
          <p className="text-lg font-bold">{t("blog.cta")}</p>
          <Link
            href="/#packages"
            className="mt-3 inline-block rounded-full bg-shqiponja px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-shqiponja/25 hover:bg-shqiponja-dark transition"
          >
            {t("blog.viewPackages")}
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-bold">{t("blog.related")}</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-shqiponja/30 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <span className="text-2xl">{r.image}</span>
                  <p className="mt-2 text-sm font-bold leading-tight">{r.title[lang]}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
