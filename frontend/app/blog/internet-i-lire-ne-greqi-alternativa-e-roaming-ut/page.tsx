import type { Metadata } from "next";
import ArticlePage, { buildArticleMetadata } from "../_components/article-page";
import { getBlogArticle } from "../_data";

const article = getBlogArticle("internet-i-lire-ne-greqi-alternativa-e-roaming-ut")!;

export const metadata: Metadata = buildArticleMetadata(article);

export default function Page() {
  return <ArticlePage article={article} />;
}
