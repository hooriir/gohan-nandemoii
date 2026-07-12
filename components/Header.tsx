"use client";

// components/Header.tsx
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  return (
    // 全体の最大幅をメインカードと同じ 900px に合わせ、中央寄せにします
    <div className="w-full max-w-[900px] flex flex-col items-center mb-6 relative px-4 select-none">
      
      {/* ロゴと右側メニューを綺麗に横並び＆中央寄せにするコンテナ */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 w-full">
        
        {/* 左側：ロゴテキスト部分 */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left shrink-0">
          <p className="text-white text-xs sm:text-sm font-bold tracking-wider mb-0.5">
            {isLoggedIn ? `${session.user?.name ?? "ユーザー"}さんの` : "ゲストさんの"}
          </p>
          {/* TOPで使用したメインロゴ画像 */}
          <Image
            src="/images/title.svg"
            alt="ごはん？なんでもいい～"
            width={279}
            height={131}
            className="w-[200px] h-auto sm:w-[250px] md:w-[279px]"
            priority
          />
        </div>

        {/* 右側：アイコン（メニュー）エリア */}
        {/* ★ flex-col を指定して、お茶碗とお箸を縦に並べます */}
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
                  className="w-[100px] h-auto sm:w-[120px]"
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
                  className="w-[100px] h-auto sm:w-[120px]"
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
                onClick={() => signOut()}
              >
                <Image
                  src="/images/hashi.svg"
                  alt="ログアウト"
                  width={127}
                  height={28}
                  className="w-[110px] h-auto sm:w-[127px]"
                />
                <span className="absolute bottom-[30%] text-slate-700 font-black text-[10px] sm:text-xs tracking-wider group-hover:text-brand-blue transition-colors duration-200">
                  ログアウト
                </span>
              </button>
            ) : (
              <Link href="/login" className="relative flex items-center justify-center">
                <Image
                  src="/images/hashi.svg"
                  alt="ログイン"
                  width={127}
                  height={28}
                  className="w-[110px] h-auto sm:w-[127px]"
                />
                <span className="absolute bottom-[30%] text-slate-700 font-black text-[10px] sm:text-xs tracking-wider group-hover:text-brand-blue transition-colors duration-200">
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