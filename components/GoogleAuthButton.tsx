"use client";

import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

type GoogleAuthButtonProps = {
  label: string;
};

export default function GoogleAuthButton({ label }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const origin = window.location.origin;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // 既存メールログインと同じく、最終的にホームへ
        redirectTo: `${origin}/auth/callback?next=/`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (oauthError) {
      setError("Googleログインに失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <p className="mb-2 text-left text-sm text-red-600">{error}</p>
      )}
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isLoading}
        className="w-full mt-4 py-3 font-bold rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
      >
        {isLoading ? "リダイレクト中..." : label}
      </button>
    </div>
  );
}