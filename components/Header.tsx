"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Header() {
  const [userName, setUserName] = useState<string | null>(null);
  const isLoggedIn = !!userName;

  const supabase = createClient();

  useEffect(() => {
    // 1. 初回読み込み時に現在のセッションからユーザーを取得
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "ユーザー";
        setUserName(name);
      } else {
        setUserName(null);
      }
    }
    checkUser();

    // 2. ログイン・ログアウトのリアルタイム状態変化をキャッチ
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "ユーザー";
        setUserName(name);
      } else {
        setUserName(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // ログアウト処理
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserName(null);
      window.location.href = "/"; // トップへ戻してリフレッシュ
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  return (
    <div className="w-full max-w-[900px] flex flex-col items-center mb-6 relative px-4 select-none">
      
      {/* ロゴと右側メニューを綺麗に横並びにするコンテナ（画像のデザインを再現） */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
        
        {/* 左側：ロゴとユーザー名テキスト */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left shrink-0">
          <p className="text-white text-sm sm:text-base font-bold tracking-wider mb-1 drop-shadow-sm">
            {isLoggedIn ? `${userName}さんの` : "ゲストさんの"}
          </p>
          <Link href="/">
            <Image
              src="/images/title.svg"
              alt="ごはん？なんでもいい～"
              width={279}
              height={131}
              style={{ width: "230px", height: "auto" }} // アスペクト比警告対策
              className="sm:w-[250px] md:w-[279px] transform hover:scale-102 transition-transform duration-200"
              priority
            />
          </Link>
        </div>

        {/* 右側：アイコン（メニュー）エリア */}
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          
          {/* 上段：ごはん画像（マイページ または 新規登録） */}
          <div className="relative flex items-center justify-center group cursor-pointer transform hover:scale-105 hover:rotate-2 transition-all duration-200">
            {isLoggedIn ? (
              <Link href="/mypage" className="relative flex items-center justify-center">
                <Image
                  src="/images/gohan.svg"
                  alt="マイページ"
                  width={120}
                  height={96}
                  style={{ width: "110px", height: "auto" }}
                />
                <span className="absolute bottom-[26%] text-slate-700 font-black text-xs sm:text-sm tracking-wider group-hover:text-brand-red transition-colors duration-200">
                  マイページ
                </span>
              </Link>
            ) : (
              <Link href="/register" className="relative flex items-center justify-center">
                <Image
                  src="/images/gohan.svg"
                  alt="新規登録"
                  width={120}
                  height={96}
                  style={{ width: "110px", height: "auto" }}
                />
                <span className="absolute bottom-[26%] text-slate-700 font-black text-xs sm:text-sm tracking-wider group-hover:text-brand-red transition-colors duration-200">
                  新規登録
                </span>
              </Link>
            )}
          </div>

          {/* 下段：はし画像（ログアウト または ログイン） */}
          <div className="relative flex items-center justify-center group cursor-pointer transform hover:scale-105 hover:-rotate-2 transition-all duration-200">
            {isLoggedIn ? (
              <button 
                className="bg-transparent border-none p-0 relative flex items-center justify-center cursor-pointer outline-none" 
                onClick={handleSignOut}
              >
                <Image
                  src="/images/hashi.svg"
                  alt="ログアウト"
                  width={140}
                  height={32}
                  style={{ width: "130px", height: "auto" }}
                />
                <span className="absolute bottom-[30%] text-slate-700 font-black text-[11px] sm:text-xs tracking-wider group-hover:text-brand-blue transition-colors duration-200">
                  ログアウト
                </span>
              </button>
            ) : (
              <Link href="/login" className="relative flex items-center justify-center">
                <Image
                  src="/images/hashi.svg"
                  alt="ログイン"
                  width={140}
                  height={32}
                  style={{ width: "130px", height: "auto" }}
                />
                <span className="absolute bottom-[30%] text-slate-700 font-black text-[11px] sm:text-xs tracking-wider group-hover:text-brand-blue transition-colors duration-200">
                  ログイン
                </span>
              </Link>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}