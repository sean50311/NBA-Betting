"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";

type User = {
  id: number;
  username: string;
  nickname: string;
  avatarDataUrl: string | null;
  points: number;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          window.location.href = "/login";
          return;
        }
        setUser(d.user);
        setNickname(d.user.nickname);
      });
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 400_000) {
      setErr("圖片請小於約 400KB");
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result ?? "");
      if (url.length > 450_000) {
        setErr("圖片編碼後過大");
        return;
      }
      setUser((u) => (u ? { ...u, avatarDataUrl: url } : u));
      setErr(null);
    };
    r.readAsDataURL(f);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        avatarDataUrl: user?.avatarDataUrl ?? "",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "更新失敗");
      return;
    }
    setUser(data.user);
    setSaved(true);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <AppHeader />
        <p className="p-8 text-center text-zinc-500">載入中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold text-white">個人資料</h1>
        <p className="mt-1 text-sm text-zinc-500">帳號：{user.username}</p>
        <p className="text-sm text-orange-300">目前積分：{user.points}</p>

        <form onSubmit={save} className="mt-8 space-y-4">
          <div className="flex items-center gap-4">
            {user.avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarDataUrl}
                alt=""
                className="h-20 w-20 rounded-full border border-white/15 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-2xl text-zinc-400">
                {nickname.slice(0, 1)}
              </div>
            )}
            <div>
              <label className="text-xs text-zinc-400">大頭照</label>
              <input type="file" accept="image/*" className="mt-1 text-sm text-zinc-400" onChange={onFile} />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400">暱稱</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          {saved && <p className="text-sm text-emerald-400">已儲存</p>}
          <button
            type="submit"
            className="rounded-lg bg-orange-500 px-6 py-2 font-medium text-black hover:bg-orange-400"
          >
            儲存變更
          </button>
        </form>
      </main>
    </div>
  );
}
