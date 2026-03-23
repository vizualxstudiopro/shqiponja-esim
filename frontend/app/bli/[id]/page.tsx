import { getPackageById } from "@/lib/api";
import BuyPageContent from "./buy-content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BliPage({ params }: Props) {
  const { id } = await params;
  const pkg = await getPackageById(Number(id));
  if (!pkg) notFound();

  return <BuyPageContent pkg={pkg} />;
}
