"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  return (
    // 画面全体をブランドカラーの水色にし、縦並びで中央寄せにする
    <main className="bg-brand-bg min-h-screen flex flex-col items-center justify-center p-6 select-none">
      
      {/* テキスト・タイトルエリア */}
      <div className="text-center mb-12">
        <p className="text-white font-bold text-lg tracking-wider mb-2 drop-shadow-sm">
          {isLoggedIn ? `${session.user?.name ?? "ユーザー"}さんの` : "ゲストさんの"}
        </p>

        <h1 className="flex justify-center transform hover:scale-102 transition-transform duration-300">
          <Image
            src="/images/title.svg"
            alt="ごはん？なんでもいい～"
            width={360}
            height={168}
            priority
          />
        </h1>
      </div>

      {/* アイコン（メニュー）エリア */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-16 w-full max-w-lg">
        
        {/* 左側：ごはん画像（マイページ または 新規登録） */}
        <div className="relative flex items-center justify-center group cursor-pointer transform hover:scale-105 hover:rotate-2 transition-all duration-200">
          {isLoggedIn ? (
            <Link href="/mypage" className="relative flex items-center justify-center">
              <Image
                src="/images/gohan.svg"
                alt="マイページ"
                width={160}
                height={127}
              />
              {/* 白背景や枠線をなくし、文字だけに。ホバーでブランド赤色に変化 */}
              <span className="absolute bottom-[26%] text-slate-700 font-black text-sm tracking-wider group-hover:text-brand-red transition-colors duration-200">
                マイページ
              </span>
            </Link>
          ) : (
            <Link href="/register" className="relative flex items-center justify-center">
              <Image
                src="/images/gohan.svg"
                alt="新規登録"
                width={160}
                height={127}
              />
              {/* 白背景や枠線をなくし、文字だけに。ホバーでブランド赤色に変化 */}
              <span className="absolute bottom-[26%] text-slate-700 font-black text-sm tracking-wider group-hover:text-brand-red transition-colors duration-200">
                新規登録
              </span>
            </Link>
          )}
        </div>

        {/* 右側：はし画像（ログアウト または ログイン） */}
        <div className="relative flex items-center justify-center group cursor-pointer transform hover:scale-105 hover:-rotate-2 transition-all duration-200">
          {isLoggedIn ? (
            <button 
              className="bg-transparent border-none p-0 relative flex items-center justify-center cursor-pointer outline-none" 
              onClick={() => signOut()}
            >
              <Image
                src="/images/hashi.svg"
                alt="ログアウト"
                width={180}
                height={40}
              />
              {/* 白背景や枠線をなくし、文字だけに。ホバーでブランド水色に変化 */}
              <span className="absolute bottom-[30%] text-slate-700 font-black text-xs tracking-wider group-hover:text-brand-blue transition-colors duration-200">
                ログアウト
              </span>
            </button>
          ) : (
            <Link href="/login" className="relative flex items-center justify-center">
              <Image
                src="/images/hashi.svg"
                alt="ログイン"
                width={180}
                height={40}
              />
              {/* 白背景や枠線をなくし、文字だけに。ホバーでブランド水色に変化 */}
              <span className="absolute bottom-[30%] text-slate-700 font-black text-xs tracking-wider group-hover:text-brand-blue transition-colors duration-200">
                ログイン
              </span>
            </Link>
          )}
        </div>

      </div>
    </main>
  );
}