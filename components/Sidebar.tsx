// components/Sidebar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();

  // 各メニューの共通デザインを判定する関数
  const getButtonClass = (path: string) => {
    const baseClass = "flex-1 md:flex-none flex flex-col items-center bg-white p-3 rounded-2xl shadow-md transition-all w-full text-center";
    // 現在のページだったら青枠、それ以外なら薄いグレー枠＋ホバー効果
    if (pathname === path) {
      return `${baseClass} border-2 border-brand-blue text-slate-700`;
    }
    return `${baseClass} border border-slate-100 hover:bg-slate-50 text-slate-600`;
  };

  return (
    <div className="w-full md:w-[160px] flex md:flex-col gap-3 shrink-0">
      
      {/* プロフィール */}
      <Link href="/mypage/profile" className={getButtonClass('/mypage/profile')}>
        <Image src="/images/ume.svg" width={53} height={46} alt='うめぼし' className="w-10 h-10 mb-1" />
        <span className="text-[10px] font-bold">プロフィール</span>
      </Link>
      
      {/* ごはん登録・一覧 */}
      <Link href="/menus" className={getButtonClass('/menus')}>
        <Image src="/images/chawan.svg" width={80} height={46} alt='茶碗' className="w-10 h-10 mb-1" />
        <span className="text-[10px] font-bold">ごはん登録・一覧</span>
      </Link>
      
      {/* パスワード変更 */}
      {/* <Link href="/password" className={getButtonClass('/password')}>
        <Image src="/images/ume.svg" width={53} height={46} alt='うめぼし' className="w-10 h-10 mb-1" />
        <span className="text-[10px] font-bold">パスワード変更</span>
      </Link> */}

    </div>
  );
}