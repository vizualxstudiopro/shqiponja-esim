import { getOrderById } from "@/lib/api";
import OrderPageContent from "./order-content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PorosiPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(Number(id));
  if (!order) notFound();

  return <OrderPageContent order={order} />;
}
