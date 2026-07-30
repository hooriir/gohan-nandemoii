// app/mypage/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header'; 
import { createClient } from '@/utils/supabase/client'; 
import { User } from '@supabase/supabase-js';

export default function MyPageTop() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // コンポーネント生成時に一度だけクライアントを作成
    const supabase = createClient();

    async function checkUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        setUser(user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    }
    
    checkUser();
  }, [router]);

  if (loading) {
    return <div className="text-center p-10 text-white bg-[#54C7F3] min-h-screen">読み込み中...</div>;
  }

  if (!user) return null;

  return (
    <div className="bg-[#54C7F3] min-h-screen flex flex-col font-sans">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <Header />
        
        <h2 className="text-white text-2xl font-black mb-8 tracking-wider">
          マイページ
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:flex-col gap-2 max-w-md w-full px-4 justify-items-center justify-center">
          
          {/* 1. プロフィールカード */}
          <Link 
            href="/mypage/profile"
            className="group bg-white rounded-2xl p-4 aspect-square flex flex-col items-center justify-center shadow-lg hover:scale-105 transition transform w-full"
          >
            <Image src="/images/ume.svg" width={84} height={74} alt="うめぼし" className="w-16 h-16 mb-4" />
            <span className="text-gray-700 font-bold text-sm group-hover:text-brand-red transition-colors duration-200">
              プロフィール
            </span>
          </Link>

          {/* 2. ごはん登録・一覧カード */}
          <Link 
            href="/menus"
            className="group bg-white rounded-2xl p-4 aspect-square flex flex-col items-center justify-center shadow-lg hover:scale-105 transition transform w-full"
          >
            <Image src="/images/chawan.svg" width={130} height={74} alt="茶碗" className="w-16 h-16 mb-4" />
            <span className="text-gray-700 font-bold text-sm group-hover:text-brand-red transition-colors duration-200">
              ごはん登録・一覧
            </span>
          </Link>

        </div>
      </main>
    </div>
  );
}