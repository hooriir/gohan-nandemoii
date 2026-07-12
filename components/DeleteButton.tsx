// components/DeleteButton.tsx
'use client'; // ★ ブラウザ側で動かす指定

import { deleteDish } from "@/app/actions";

interface DeleteButtonProps {
  dishId: string;
}

export default function DeleteButton({ dishId }: DeleteButtonProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm("本当にこのメニューを削除しますか？")) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteDish} className="flex-1" onSubmit={handleSubmit}>
      <input type="hidden" name="dishId" value={dishId} />
      <button 
        type="submit" 
        className="w-full bg-white hover:bg-red-50 text-brand-red border border-brand-red text-[10px] font-bold py-1 px-2 rounded shadow-sm transition-colors"
      >
        削除
      </button>
    </form>
  );
}