// HTTPレスポンスを返すためのもの
import { NextResponse } from "next/server";

// 削除キーをハッシュ化して保存するための暗号ライブラリ
import crypto from "crypto";

// DB（supabase）にアクセスするための管理クライアント
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 削除キーをランダムに生成
function makeDeleteToken() {
  // コピペしやすい感じに１６進数４文字で生成
  return crypto.randomBytes(2).toString("hex");
}

// 削除キーをハッシュ化
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// GETリクエスト：投稿一覧の取得
export async function GET() {
  try {
    console.log("GET /api/posts start");
    console.log("SUPABASE_URL exists?", !!process.env.NEXT_PUBLIC_SUPABASE_URL, !!process.env.SUPABASE_URL);

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("id,title,date,area,comment,x_username,created_at")
      .order("created_at", { ascending: false });

    console.log("supabase returned", { hasData: !!data, error: error?.message });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, posts: data });
  } catch (e: any) {
    console.error("GET /api/posts crashed:", e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

// API Routeのポストハンドラ
export async function POST(req: Request) {
  const body = await req.json();

  const title = String(body.title ?? "").trim();
  const date = String(body.date ?? "").trim();
  const area = String(body.area ?? "").trim();
  const comment = String(body.comment ?? "").trim();
  const xUsernameRaw = String(body.xUsername ?? "").trim();

  // バリデーション：必須項目のチェック
  if (!title || !date || !area || !xUsernameRaw) {
    return NextResponse.json(
      { ok: false, error: "REQUIRED_FIELDS" },
      { status: 400 }
    );
  }

  // Xユーザ名の先頭に@がなければ付与を三項演算子で処理
  const x_username = xUsernameRaw.startsWith("@") ? xUsernameRaw : `@${xUsernameRaw}`;

  // 削除キーの生成とハッシュ化
  const deleteToken = makeDeleteToken();
  const delete_token_hash = hashToken(deleteToken);

  const { data, error } = await supabaseAdmin
    .from("posts") // 対象のテーブルを選択
    .insert({ // 挿入するデータをオブジェクトで指定
      title,
      date,
      area,
      comment: comment || null,
      x_username,
      delete_token_hash,
    })
    .select("id,title,date,area,comment,x_username,created_at") // 挿入後に取得するカラムを指定
    .single(); // 一つのオブジェクトとして扱う

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, post: data, deleteToken });
}
