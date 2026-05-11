import type { Metadata } from "next";
import ArticlePage, { buildArticleMetadata } from "../_components/article-page";
import { getBlogArticle } from "../_data";

const article = getBlogArticle("kur-duhet-te-aktivizosh-esim-para-nisjes")!;

export const metadata: Metadata = buildArticleMetadata(article);

export default function Page() {
  return <ArticlePage article={article} />;
}
