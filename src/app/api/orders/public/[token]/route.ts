import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_order", { p_token: token });
  if (error || !data?.[0]) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ order: data[0] });
}
