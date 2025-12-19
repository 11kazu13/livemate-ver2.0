"use client"; // クライアントサーバーモード

import { useEffect, useMemo, useState } from "react";

type Post = {
  id: number;
  title: string;
  date: string;
  area: string;
  comment: string | null;
  x_username: string;
  created_at: string;
};

export default function Home() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [area, setArea] = useState("");
  const [comment, setComment] = useState("");
  const [xUsername, setXUsername] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const isValid = useMemo(() => {
    return title.trim() && date.trim() && area.trim() && xUsername.trim();
  }, [title, date, area, xUsername]);

  // 起動時にDBから読み込む
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/posts", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) setPosts(data.posts);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isValid) {
      alert("ライブ名・日付・会場・Xユーザ名は必須です！");
      return;
    }

    const payload = {
      title,
      date,
      area,
      comment,
      xUsername,
    };

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

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

    // reset
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

  async function handleDelete(id: number) {
  const deleteToken = prompt("4桁の削除キーを入力してください");
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold">ライブ同行掲示板</h1>
        <p className="text-sm text-gray-400">
          「ひとりで現場行くのがちょっと怖い…」を解決する掲示板です。
        </p>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <section className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">同行者を募集する</h2>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm mb-1">ライブ名</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                className="w-full rounded bg-gray-900 border border-gray-700 p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">日付</label>
              <input
                value={date}
                min={today}
                onChange={handleDateChange}
                type="date"
                className="date-input w-full rounded bg-gray-900 border border-gray-700 p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">会場名</label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                type="text"
                placeholder="例）Veats Shibuya"
                className="w-full rounded bg-gray-900 border border-gray-700 p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Xユーザ名</label>
              <input
                value={xUsername}
                onChange={(e) => setXUsername(e.target.value)}
                type="text"
                placeholder="例）@nagi_nyan"
                className="w-full rounded bg-gray-900 border border-gray-700 p-2"
              />
              <p className="text-xs text-gray-400 mt-1">
                連絡を行うためのXのユーザ名を教えてください。
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1">ひとこと</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="初現場なので優しくしてください…など"
                className="w-full rounded bg-gray-900 border border-gray-700 p-2"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 rounded p-2 font-medium disabled:opacity-50"
              disabled={!isValid}
            >
              投稿する
            </button>
          </form>
        </section>

        <section className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">募集一覧</h2>

          {loading ? (
            <p className="text-gray-400 text-sm">読み込み中…</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-400 text-sm">まだ投稿はありません。</p>
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
        © 2025 LiveMate
      </footer>
    </div>
  );
}
