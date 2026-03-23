import { getOrderById } from "@/lib/api";
import OrderPageContent from "./order-content";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PorosiPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(Number(id));

  return <OrderPageContent order={order} />;
}
