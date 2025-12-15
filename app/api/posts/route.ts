import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function makeDeleteToken() {
  // 人間がコピペしやすい感じに（長すぎない）
  return crypto.randomBytes(16).toString("hex"); // 32文字
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id,title,date,area,comment,x_username,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, posts: data });
}

export async function POST(req: Request) {
  const body = await req.json();

  const title = String(body.title ?? "").trim();
  const date = String(body.date ?? "").trim();
  const area = String(body.area ?? "").trim();
  const comment = String(body.comment ?? "").trim();
  const xUsernameRaw = String(body.xUsername ?? "").trim();

  if (!title || !date || !area || !xUsernameRaw) {
    return NextResponse.json(
      { ok: false, error: "REQUIRED_FIELDS" },
      { status: 400 }
    );
  }

  const x_username = xUsernameRaw.startsWith("@") ? xUsernameRaw : `@${xUsernameRaw}`;

  const deleteToken = makeDeleteToken();
  const delete_token_hash = hashToken(deleteToken);

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({
      title,
      date,
      area,
      comment: comment || null,
      x_username,
      delete_token_hash,
    })
    .select("id,title,date,area,comment,x_username,created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, post: data, deleteToken });
}
