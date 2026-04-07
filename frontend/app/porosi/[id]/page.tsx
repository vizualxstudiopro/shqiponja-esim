import { getOrderById } from "@/lib/api";
import OrderPageContent from "./order-content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function PorosiPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;
  const order = await getOrderById(Number(id), token);
  if (!order) notFound();

  return <OrderPageContent order={order} token={token} />;
}
