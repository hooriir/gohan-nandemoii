// components/AutoLogoutProvider.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const TIMEOUT_MS = 15 * 60 * 1000;

export default function AutoLogoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // 1. ログアウト実行処理
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login?reason=timeout";
    } catch (error) {
      console.error("自動ログアウト失敗:", error);
    }
  }, [supabase]);

  // 2. タイマーリセット処理
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
  }, [handleLogout]);

  // 3. 認証状態の監視とタイマーの制御
  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    const handleUserActivity = () => {
      resetTimer();
    };

    // Supabaseの認証状態の変化を監視（更新直後のセッション確定も取れる）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // ログイン中の場合のみタイマーをセット＆イベント監視開始
        resetTimer();
        events.forEach((e) => window.addEventListener(e, handleUserActivity, { passive: true }));
      } else {
        // ログアウト状態ならタイマー解除＆イベント削除
        if (timerRef.current) clearTimeout(timerRef.current);
        events.forEach((e) => window.removeEventListener(e, handleUserActivity));
      }
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, handleUserActivity));
      subscription.unsubscribe();
    };
  }, [supabase, resetTimer]);

  return <>{children}</>;
}