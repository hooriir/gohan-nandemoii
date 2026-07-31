"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Header() {
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggedIn = !!userName;

  useEffect(() => {
    const supabase = createClient();

    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "ユーザー";
          setUserName(name);
        } else {
          setUserName(null);
        }
      } catch (error) {
        console.error("ユーザー情報の取得エラー:", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "ユーザー";
        setUserName(name);
      } else {
        setUserName(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUserName(null);
      window.location.href = "/";
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  return (
    <header className="w-full max-w-[900px] flex flex-col items-center mb-6 relative px-4 select-none">
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
        
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left shrink-0">
          <p className="text-white text-sm sm:text-base font-bold tracking-wider mb-1 drop-shadow-sm min-h-[1.5rem]">
            {!isLoading && (isLoggedIn ? `${userName}さんの` : "ゲストさんの")}
          </p>
          <Link href="/">
            <Image
              src="/images/title.svg"
              alt="ごはん？なんでもいい～"
              width={279}
              height={131}
              style={{ width: "230px", height: "auto" }}
              className="sm:w-[250px] md:w-[279px] transform hover:scale-105 transition-transform duration-200"
              priority
            />
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          
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

          <div className="relative flex items-center justify-center group cursor-pointer transform hover:scale-105 hover:-rotate-2 transition-all duration-200">
            {isLoggedIn ? (
              <button 
                type="button"
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
    </header>
  );
}