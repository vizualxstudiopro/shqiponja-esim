import type { Metadata } from "next";
import ArticlePage, { buildArticleMetadata } from "../_components/article-page";
import { getBlogArticle } from "../_data";

const article = getBlogArticle("esim-apo-roaming-krahasim-praktik-per-udhetaret-shqiptare")!;

export const metadata: Metadata = buildArticleMetadata(article);

export default function Page() {
  return <ArticlePage article={article} />;
}
