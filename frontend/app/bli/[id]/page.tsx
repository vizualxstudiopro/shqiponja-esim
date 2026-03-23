import { getPackageById } from "@/lib/api";
import BuyPageContent from "./buy-content";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BliPage({ params }: Props) {
  const { id } = await params;
  let pkg;
  try {
    pkg = await getPackageById(Number(id));
  } catch {
    notFound();
  }

  return <BuyPageContent pkg={pkg} />;
}
