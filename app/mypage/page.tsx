'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header'; 
import { createClient } from '@/utils/supabase/client'; 
import { User } from '@supabase/supabase-js';

export default function MyPageTop() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      // ユーザーセッションを取得
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        // セッションがない（未ログイン）ならログイン画面へリダイレクト
        router.push('/login');
      }
      setLoading(false);
    }
    checkUser();
  }, [supabase, router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  // 読み込み中の表示
  if (loading) {
    return <div className="text-center p-10 text-white bg-brand-bg min-h-screen">読み込み中...</div>;
  }

  // セッションがない場合は何も表示しない（リダイレクトを待つ）
  if (!user) return null;

  return (
    // 背景色（ログイン画面と統一：bg-brand-bg、または画像に合わせるなら bg-[#54C7F3]）
    <div className="bg-[#54C7F3] min-h-screen flex flex-col font-sans">
      
      {/* メインコンテンツエリア */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        <Header />
        {/* 中部：セクション見出し */}
        <h2 className="text-white text-2xl font-black mb-8 tracking-wider">
          マイページ
        </h2>

        {/* 下部：3つのメニューカード */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:flex-col gap-2 max-w-md w-full px-4 justify-items-center justify-center">
        
          {/* 1. プロフィールカード */}
          <button 
            onClick={() => router.push('/mypage/profile')}
            className="group bg-white rounded-2xl p-4 aspect-square flex flex-col items-center justify-center shadow-lg hover:scale-105 transition transform"
          >
            <Image src="/images/ume.svg" width={84} height={74} alt="うめぼし" className="w-16 h-16 mb-4" />
            <span className="text-gray-700 font-bold text-sm group-hover:text-brand-red transition-colors duration-200">
              プロフィール
            </span>
          </button>

          {/* 2. ごはん登録・一覧カード */}
          <button 
            onClick={() => router.push('/menus')}
            className="group bg-white rounded-2xl p-4 aspect-square flex flex-col items-center justify-center shadow-lg hover:scale-105 transition transform"
          >
            <Image src="/images/chawan.svg" width={130} height={74} alt="茶碗" className="w-16 h-16 mb-4" />
            <span className="text-gray-700 font-bold text-sm group-hover:text-brand-red transition-colors duration-200">
              ごはん登録・一覧
            </span>
          </button>

          {/* 3. パスワード変更カード */}
          {/* <button 
            onClick={() => router.push('/mypage/password')}
            className="group bg-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg hover:scale-105 transition transform aspect-square"
          >
            <Image src="/images/ume.svg" width={84} height={74} alt="うめぼし" className="w-16 h-16 mb-4" />
            <span className="text-gray-700 font-bold text-sm group-hover:text-brand-red transition-colors duration-200">
              パスワード変更
            </span>
          </button> */}

        </div>
      </main>
    </div>
  );
}