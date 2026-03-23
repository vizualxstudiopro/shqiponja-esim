import { getOrderById } from "@/lib/api";
import OrderPageContent from "./order-content";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PorosiPage({ params }: Props) {
  const { id } = await params;
  let order;
  try {
    order = await getOrderById(Number(id));
  } catch {
    notFound();
  }

  return <OrderPageContent order={order} />;
}
