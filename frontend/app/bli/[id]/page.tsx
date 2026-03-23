import { getPackageById } from "@/lib/api";
import OrderForm from "./order-form";
import BuyPageContent from "./buy-content";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BliPage({ params }: Props) {
  const { id } = await params;
  const pkg = await getPackageById(Number(id));

  return <BuyPageContent pkg={pkg} />;
}
