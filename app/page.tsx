"use client";

import { useEffect, useMemo, useState } from "react";

// 投稿データのタイプを定義
type Post = {
  id: number;
  title: string;
  date: string;
  area: string;
  comment: string | null;
  x_username: string;
  created_at: string;
};

// メインコンポーネント
export default function Home() {
  const [title, setTitle] = useState(""); // titleという状態（state）を作りそれを更新するsetTitleを用意・初期値は空
  const [date, setDate] = useState("");
  const [area, setArea] = useState("");
  const [comment, setComment] = useState("");
  const [xUsername, setXUsername] = useState("");

  // DBから読み込んだ投稿と読み込みの状態
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 今日の日付をレンダリング時に一回のみ計算して保持
  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // フォームのバリデーション（依存配列が更新された場合のみ実行）
  const isValid = useMemo(() => {
    return title.trim() && date.trim() && area.trim() && xUsername.trim();
  }, [title, date, area, xUsername]);

  // 起動時にDBから投稿を読み込む
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/posts", { cache: "no-store" }); // APIルートにアクセス・キャッシュは無効
        const data = await res.json(); // JSONの文字列をJSで扱える形に変換
        if (data.ok) setPosts(data.posts); // 正常時はpostsにセット
      } finally {
        setLoading(false); // 読み込み完了
      }
    })();
  }, []); // 空配列：初回レンダリング時に一回のみ

  // フォームの送信処理
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // デフォルトのリロードをキャンセル
    e.preventDefault();

    // バリデーションチェック
    if (!isValid) {
      alert("ライブ名・日付・会場・Xユーザ名は必須です！");
      return;
    }

    // サーバーに送るためのデータをまとめたオブジェクトを作成
    const payload = {
      title,
      date,
      area,
      comment,
      xUsername,
    };

    // フォームに入力された内容をPOSTリクエストで送信
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // エラーチェック
    if (!data.ok) {
      alert(`投稿に失敗: ${data.error ?? "UNKNOWN"}`);
      return;
    }

    // 返ってきたpostを先頭に追加
    setPosts((prev) => [data.post as Post, ...prev]);

    // deleteTokenはこの瞬間だけ表示
    alert(
      `投稿完了！\n\n【削除キー】\n${data.deleteToken}\n\n※このキーは再発行できません。メモしてね。`
    );

    // xへの共有
    // 投稿内容を定義
    const lines = [
      "同行者募集🎤",
      `【ライブ】${title}`,
      `【日程】${date}`,
      `【会場】${area}`,
      comment?.trim() ? `【ひとこと】${comment.trim()}` : null,
      "",
      "#推し活",
    ].filter(Boolean);

    const shareText = lines.join("\n");

    // サイトのURL
    const siteUrl = window.location.origin + "/";

    // Xの投稿画面を開く
    const intentUrl =
      "https://twitter.com/intent/tweet?" +
      new URLSearchParams({ text: shareText, url:siteUrl }).toString();

    window.open(intentUrl, "_blank", "noopener,noreferrer");

    // リセット
    setTitle("");
    setDate("");
    setArea("");
    setComment("");
    setXUsername("");
  }

  // 日付入力の制御（今日以前の日付を選べないようにする）
  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;

    // ユーザーが入力を消去したいケースを許諾するため、空文字は許可
    if (!v) {
      setDate("");
      return;
    }

    const selected = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0,);

    if (selected >= today) {
      setDate(v);
    } else {
      alert("過去の日付は選択できません（当日以降を選んでください）");
    }
  }

  // 指定された投稿を削除する処理
  async function handleDelete(id: number) {
    // 削除キー入力
    const deleteToken = window.prompt("4桁の削除キーを入力してください");
    if (!deleteToken) return;

    const res = await fetch(`/api/posts/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteToken }),
    });

    const data = await res.json();

    if (!data.ok) {
      alert(
        data.error === "INVALID_DELETE_TOKEN"
          ? "削除キーが違います"
          : "削除に失敗しました"
      );
      return;
  }

  setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  // コンポーネントのレンダリング
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-main)]">
      <header className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold">ライブ同行掲示板</h1>
        <p className="text-sm text-[var(--text-sub)]">
          一緒にライブに行く友だちを募集してみませんか？
        </p>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <section className="
          bg-[var(--panel)]
          border border-[var(--border)]
          rounded-[var(--radius-lg)]
          shadow-[var(--shadow-soft)]
          p-6
        ">
          <h2 className="text-lg font-semibold mb-4">同行者を募集する</h2>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm mb-1">ライブ名</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                className="
                  w-full
                  rounded-[var(radius)]
                  bg-[#2a0f45]
                  border border-[var(--border)]
                  px-4 py-2
                  text-sm
                  placeholder:text-[var(--text-sub)]
                  focus:outline-none
                  focus:border-[var(--accent)]
                  focus:ring-1 focus:ring-[var(--accent)]
                "
              />
            </div>

            <div>
              <label className="block text-sm mb-1">日付</label>
              <input
                value={date}
                min={today}
                onChange={handleDateChange}
                type="date"
                className="
                  w-full
                  rounded-[var(radius)]
                  bg-[#2a0f45]
                  border border-[var(--border)]
                  px-4 py-2
                  text-sm
                  placeholder:text-[var(--text-sub)]
                  focus:outline-none
                  focus:border-[var(--accent)]
                  focus:ring-1 focus:ring-[var(--accent)]
                "
              />
            </div>

            <div>
              <label className="block text-sm mb-1">会場名</label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                type="text"
                placeholder="例）Veats Shibuya"
                className="
                  w-full
                  rounded-[var(radius)]
                  bg-[#2a0f45]
                  border border-[var(--border)]
                  px-4 py-2
                  text-sm
                  placeholder:text-[var(--text-sub)]
                  focus:outline-none
                  focus:border-[var(--accent)]
                  focus:ring-1 focus:ring-[var(--accent)]
                "
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Xユーザ名</label>
              <input
                value={xUsername}
                onChange={(e) => setXUsername(e.target.value)}
                type="text"
                placeholder="例）@nagi_nyan"
                className="
                  w-full
                  rounded-[var(radius)]
                  bg-[#2a0f45]
                  border border-[var(--border)]
                  px-4 py-2
                  text-sm
                  placeholder:text-[var(--text-sub)]
                  focus:outline-none
                  focus:border-[var(--accent)]
                  focus:ring-1 focus:ring-[var(--accent)]
                "
              />
              <p className="text-xs text-[var(--text-sub)] mt-1">
                連絡を行うためのXのユーザ名を教えてください。
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1">ひとこと</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="同担さんと行けたらうれしいです…など"
                className="
                  w-full
                  rounded-[var(radius)]
                  bg-[#2a0f45]
                  border border-[var(--border)]
                  px-4 py-2
                  text-sm
                  placeholder:text-[var(--text-sub)]
                  focus:outline-none
                  focus:border-[var(--accent)]
                  focus:ring-1 focus:ring-[var(--accent)]
                "
              />
            </div>

            <button
              type="submit"
              className="
                w-full
                rounded-[var(--radius)]
                bg-white
                text-[#4f22b8]
                font-semibold
                py-2
                transition
                hover:bg-[#f3e9ff]
                hover:shadow-md
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
              disabled={!isValid}
            >
              投稿する
            </button>
          </form>
        </section>

        <section className="
          bg-[var(--panel)]
          border border-[var(--border)]
          rounded-[var(--radius-lg)]
          shadow-[var(--shadow-soft)]
          p-6
        ">
          <h2 className="text-lg font-semibold mb-4">募集一覧</h2>

          {loading ? (
            <p className="text-[var(--text-sub)] text-sm">読み込み中…</p>
          ) : posts.length === 0 ? (
            <p className="text-[var(--text-sub)] text-sm">まだ投稿はありません。</p>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <article key={p.id} className="bg-gray-900 rounded p-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{p.title}</h3>
                    <span className="text-xs text-gray-400">
                      {p.x_username}
                    </span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      削除
                    </button>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    {p.date} ｜ {p.area}
                  </p>
                  <p className="text-sm text-gray-200 mt-2">
                    {p.comment ? p.comment : "ひとことは特になし"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-2xl mx-auto p-4 text-center text-xs text-gray-500">
        © 2026 LiveMate
      </footer>
    </div>
  );
}
