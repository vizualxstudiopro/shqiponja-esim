import { getOrderById } from "@/lib/api";
import OrderPageContent from "./order-content";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function PorosiPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;
  const order = await getOrderById(Number(id), token);

  return <OrderPageContent order={order} token={token} orderId={Number(id)} />;
}
