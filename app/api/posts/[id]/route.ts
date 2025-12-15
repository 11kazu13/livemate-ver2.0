import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/src/lib/supabaseAdmin";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await _req.json().catch(() => ({}));
  const deleteToken = String(body.deleteToken ?? "").trim();

  if (!deleteToken) {
    return NextResponse.json(
      { ok: false, error: "DELETE_TOKEN_REQUIRED" },
      { status: 400 }
    );
  }

  const delete_token_hash = hashToken(deleteToken);

  // 該当投稿を取得
  const { data: post, error: fetchErr } = await supabaseAdmin
    .from("posts")
    .select("id, delete_token_hash")
    .eq("id", id)
    .single();

  if (fetchErr || !post) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (post.delete_token_hash !== delete_token_hash) {
    return NextResponse.json(
      { ok: false, error: "INVALID_DELETE_TOKEN" },
      { status: 403 }
    );
  }

  const { error: delErr } = await supabaseAdmin
    .from("posts")
    .delete()
    .eq("id", id);

  if (delErr) {
    return NextResponse.json(
      { ok: false, error: delErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
