"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, nickname: nickname || username }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "註冊失敗");
      return;
    }
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold text-white">註冊</h1>
        <p className="mt-2 text-sm text-zinc-400">註冊後將獲得基本積分，可用於季後賽下注。</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs text-zinc-400">帳號</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">密碼（至少 6 字元）</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">暱稱（選填）</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-500 py-2.5 font-medium text-black hover:bg-orange-400"
          >
            建立帳號
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          已有帳號？{" "}
          <Link href="/login" className="text-orange-400 hover:underline">
            登入
          </Link>
        </p>
      </main>
    </div>
  );
}
