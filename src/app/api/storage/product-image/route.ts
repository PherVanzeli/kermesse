import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (!allowedTypes.has(contentType) || contentLength > maxSize) {
    return NextResponse.json(
      { error: "Envie uma imagem JPG, PNG ou WebP de até 2 MB." },
      { status: 400 },
    );
  }

  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > maxSize) {
    return NextResponse.json(
      { error: "Envie uma imagem JPG, PNG ou WebP de até 2 MB." },
      { status: 400 },
    );
  }
  const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1];
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, body, {
    contentType,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: "Não foi possível salvar a imagem." }, { status: 500 });
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
