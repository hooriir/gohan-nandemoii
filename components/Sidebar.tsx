'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const getButtonClass = (path: string) => {
    const baseClass =
      "flex-1 md:flex-none flex flex-col items-center bg-white p-3 rounded-2xl shadow-md transition-all w-full text-center";

    if (isActive(path)) {
      return `${baseClass} border-2 border-[#00b2fe] text-slate-700`;
    }
    return `${baseClass} border border-slate-100 hover:bg-slate-50 text-slate-600`;
  };

  return (
    <div className="w-full md:w-[160px] flex md:flex-col gap-3 shrink-0">

      <Link href="/mypage/profile" className={getButtonClass('/mypage/profile')}>
        <Image src="/images/ume.svg" width={53} height={46} alt='うめぼし' className="w-10 h-10 mb-1" />
        <span className="text-[10px] font-bold">プロフィール</span>
      </Link>
      
      <Link href="/menus" className={getButtonClass('/menus')}>
        <Image src="/images/chawan.svg" width={80} height={46} alt='茶碗' className="w-10 h-10 mb-1" />
        <span className="text-[10px] font-bold">ごはん登録・一覧</span>
      </Link>

    </div>
  );
}