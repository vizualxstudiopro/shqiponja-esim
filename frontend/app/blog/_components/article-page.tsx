import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import type { BlogArticle } from "../_data";

export function buildArticleMetadata(article: BlogArticle): Metadata {
  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: `https://shqiponjaesim.com/blog/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://shqiponjaesim.com/blog/${article.slug}`,
      type: "article",
      locale: "sq_AL",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

export default function ArticlePage({ article }: { article: BlogArticle }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <article className="overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className={`bg-gradient-to-br ${article.accent} border-b border-zinc-200 px-8 py-12 dark:border-zinc-800`}>
            <span className="inline-flex rounded-full border border-shqiponja/20 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-shqiponja dark:bg-zinc-950/70">
              Blog Shqiponja eSIM
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight text-zinc-950 sm:text-4xl dark:text-white">
              {article.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
              {article.description}
            </p>
          </div>

          <div className="px-8 py-10">
            <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">{article.intro}</p>

            {article.sections.map((section) => (
              <section key={section.heading} className="mt-10">
                <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-base leading-8 text-zinc-700 dark:text-zinc-300">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <div className="mt-12 rounded-3xl border border-shqiponja/20 bg-shqiponja/5 p-6 dark:bg-shqiponja/10">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Shiko paketat e disponueshme</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                Nëse po kërkon një paketë eSIM për destinacionin tënd, krahaso çmimet dhe opsionet aktuale te faqja e paketave.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/packages"
                  className="inline-flex rounded-full bg-shqiponja px-5 py-3 text-sm font-semibold text-white transition hover:bg-shqiponja-dark"
                >
                  Shko te paketat
                </Link>
                <Link
                  href="/"
                  className="inline-flex rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-shqiponja/30 hover:text-shqiponja dark:border-zinc-700 dark:text-zinc-200"
                >
                  Kthehu në ballinë
                </Link>
              </div>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
