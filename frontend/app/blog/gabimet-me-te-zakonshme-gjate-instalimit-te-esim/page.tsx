import type { Metadata } from "next";
import ArticlePage, { buildArticleMetadata } from "../_components/article-page";
import { getBlogArticle } from "../_data";

const article = getBlogArticle("gabimet-me-te-zakonshme-gjate-instalimit-te-esim")!;

export const metadata: Metadata = buildArticleMetadata(article);

export default function Page() {
  return <ArticlePage article={article} />;
}
