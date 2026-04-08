import { getOrderById } from "@/lib/api";
import OrderPageContent from "../order-content";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; token: string }>;
}

export default async function PorosiTokenPage({ params }: Props) {
  const { id, token } = await params;
  const order = await getOrderById(Number(id), token);

  return <OrderPageContent order={order} token={token} orderId={Number(id)} />;
}
