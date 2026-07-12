"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // NextAuthのログイン処理を実行
    const result = await signIn("credentials", {
      redirect: false, // 自動リダイレクトをオフにして、ここでコントロールする
      email,
      password,
    });

    if (result?.error) {
      setError("メールアドレスまたはパスワードが違います");
    } else {
      // ログイン成功したらトップ画面へ
      router.push("/");
      router.refresh(); // トップ画面の表示（ゲストさん→ユーザー名）を更新する
    }
  };

  return (
    // 画面全体を水色背景にし、中央寄せにする
    <div className="bg-brand-bg min-h-screen flex items-center justify-center p-4">
      {/* 白色の角丸カード */}
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-[400px] text-center">
        
        {/* アプリのタイトルとロゴ */}
        <h1 className="flex justify-center mb-2">
          <Image
            src="/images/gohan_bl.svg"
            alt="ごはん？なんでもいい～"
            width={160}
            height={72}          
          />
        </h1>
        
        <h2 className="text-xl font-bold text-slate-700 mb-6">ログイン</h2>

        {/* エラーメッセージ（ある場合のみ表示） */}
        {error && (
          <p className="bg-red-50 text-red-600 border border-red-200 text-sm font-medium py-2 px-3 rounded-xl mb-4 text-left">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* メールアドレス入力欄 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">メールアドレス</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-800 placeholder:text-slate-300"
            />
          </div>

          {/* パスワード入力欄 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">パスワード</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-800 placeholder:text-slate-300"
            />
          </div>

          {/* ログインボタン（水色） */}
          <Button type="submit" text="ログイン" variant="blue" />

          {/* アカウント作成への案内リンク */}
          <div className="pt-4 text-center border-t border-slate-100 mt-4">
            <span className="text-xs text-slate-400">アカウントをお持ちでないですか？</span>
            <Link 
              href="/register" 
              className="block mt-1 text-sm font-bold text-brand-red hover:underline transition-all"
            >
              新規登録はこちら
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}