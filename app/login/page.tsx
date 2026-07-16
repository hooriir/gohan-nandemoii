"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/Button";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      // ✨ ボタンを押した瞬間に、その時のブラウザ環境で確実にクライアントを生成する
      const supabase = createClient();

      // 余計なスペースなどを排除して綺麗にする
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      // Supabase Authのログイン処理を実行
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (signInError) {
        console.error("Supabaseサインイン内部エラー:", signInError);
        setError(`ログイン失敗: ${signInError.message}`);
        setIsSubmitting(false);
      } else {
        console.log("ログイン成功！セッションを取得します:", data);
        
        // 明示的にブラウザ側にセッションを覚えさせる
        if (data.session) {
          await supabase.auth.setSession(data.session);
        }

        // トップページへ移動
        router.push("/");
        
        // 移動後に確実にヘッダー側を動かすために1回だけリフレッシュ
        setTimeout(() => {
          router.refresh();
        }, 300);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "未知のエラー";
      console.error("システム例外エラー:", err);
      setError("通信中に予期せぬエラーが発生しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-brand-bg min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-[400px] text-center">
        
        <h1 className="flex justify-center mb-2">
          <Image
            src="/images/gohan_bl.svg"
            alt="ごはん？なんでもいい～"
            width={160}
            height={72}          
            style={{ width: "160px", height: "auto" }}
          />
        </h1>
        
        <h2 className="text-xl font-bold text-slate-700 mb-6">ログイン</h2>

        {error && (
          <p className="bg-red-50 text-red-600 border border-red-200 text-sm font-medium py-2 px-3 rounded-xl mb-4 text-left whitespace-pre-wrap">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">メールアドレス</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-800 placeholder:text-slate-300 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">パスワード</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-800 placeholder:text-slate-300 disabled:bg-slate-50"
            />
          </div>

          <Button type="submit" text={isSubmitting ? "ログイン中..." : "ログイン"} variant="blue" />

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