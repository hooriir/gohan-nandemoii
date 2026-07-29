"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/Button";
import { createClient } from "@/utils/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // ⭕ 型を React.FormEvent<HTMLFormElement> に修正
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setMessage("");

    // パスワードの一致チェック
    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Supabaseのログインセッション状態を使ってパスワードを更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.warn("パスワード更新失敗:", updateError.message);
        // セッションが切れている・リンクが無効な場合などの配慮
        setError(
          "パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。もう一度再設定メールを送信してください。"
        );
        setIsSubmitting(false);
        return;
      }

      setMessage("パスワードの変更が完了しました！ログイン画面に移動します...");

      // 変更成功後、2秒後にログイン画面へ遷移
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      console.error("システム例外エラー:", err);
      setError("通信中に予期せぬエラーが発生しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-brand-bg min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-[400px] text-center">
        
        {/* ロゴ */}
        <h1 className="flex justify-center mb-2">
          <Image
            src="/images/gohan_bl.svg"
            alt="ごはん？なんでもいい～"
            width={160}
            height={72}
            style={{ width: "160px", height: "auto" }}
          />
        </h1>

        <h2 className="text-xl font-bold text-slate-700 mb-6">
          新しいパスワードの設定
        </h2>

        {/* 成功メッセージ */}
        {message && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium py-3 px-4 rounded-xl mb-4 text-left whitespace-pre-wrap">
            {message}
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <p className="bg-red-50 text-red-600 border border-red-200 text-sm font-medium py-2 px-3 rounded-xl mb-4 text-left whitespace-pre-wrap">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">
              新しいパスワード
            </label>
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

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">
              新しいパスワード（確認）
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-800 placeholder:text-slate-300 disabled:bg-slate-50"
            />
          </div>

          <Button
            type="submit"
            text={isSubmitting ? "更新中..." : "パスワードを変更する"}
            variant="blue"
          />
        </form>
      </div>
    </div>
  );
}