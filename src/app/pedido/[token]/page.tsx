import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderTracking } from "@/components/order-tracking";

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_order", { p_token: token });
  if (error || !data?.[0]) notFound();

  return <OrderTracking token={token} initialOrder={data[0]} />;
}
