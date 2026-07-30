// components/MenuListManager.tsx
"use client";

import { useOptimistic } from "react";
import Image from "next/image";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import DishForm from "@/components/DishForm";

export type Tag = {
  id: string;
  name: string;
};

export type Dish = {
  id: string;
  name: string;
  imageUrl: string | null;
  tags: Tag[];
  isPending?: boolean; // 楽観更新中の表示用フラグ
};

interface MenuListManagerProps {
  initialDishes: Dish[];
}

export default function MenuListManager({ initialDishes }: MenuListManagerProps) {
  // ⭕ useOptimistic の設定
  const [optimisticDishes, addOptimisticDish] = useOptimistic(
    initialDishes,
    (state, newDish: Dish) => [newDish, ...state] // ボタンを押した瞬間に先頭に追加
  );

  return (
    <>
      {/* 登録フォーム */}
      <div className="text-center mb-10 pb-10 border-b border-slate-100">
        <h2 className="text-base font-black text-slate-700 flex flex-col items-center gap-1 mb-1">
          ごはん登録
        </h2>
        <p className="text-[11px] font-bold text-slate-400 mb-6">
          いつも食べてるあのごはんを登録しとく
        </p>

        {/* 楽観更新用の追加関数をフォームへ渡す */}
        <DishForm addOptimisticDish={addOptimisticDish} />
      </div>

      {/* ごはん一覧 */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-base font-black text-slate-700 flex flex-col items-center gap-1 mb-1">
            ごはん一覧
          </h2>
        </div>

        {optimisticDishes.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">
            登録された料理はまだありません。
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {optimisticDishes.map((dish) => (
              <div
                key={dish.id}
                className={`flex flex-col items-center text-center transition-opacity ${
                  dish.isPending ? "opacity-60" : "opacity-100"
                }`}
              >
                {/* 画像領域 */}
                <div className="w-full aspect-square bg-[#f4f9fd] border-2 border-[#e3f2fd] rounded-3xl overflow-hidden relative mb-3 flex items-center justify-center">
                  {dish.imageUrl ? (
                    <Image
                      src={dish.imageUrl}
                      alt={dish.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-[#c2e4fa] font-bold text-xl select-none">
                      No Image
                    </span>
                  )}
                </div>

                {/* 料理名 */}
                <h3 className="font-bold text-[#333333] text-lg mb-1">
                  {dish.name}
                  {dish.isPending && (
                    <span className="block text-xs font-normal text-slate-400">
                      (保存中...)
                    </span>
                  )}
                </h3>

                {/* ハッシュタグ */}
                <p className="text-xs text-slate-400 font-bold mb-4 min-h-[18px] flex flex-wrap justify-center gap-1">
                  {dish.tags.length > 0 ? (
                    dish.tags.map((t) => (
                      <span key={t.id || t.name}>#{t.name}</span>
                    ))
                  ) : (
                    <span className="text-slate-300">#タグなし</span>
                  )}
                </p>

                {/* ボタン群（保存中の仮カードでは操作不能にする） */}
                <div className="flex gap-3 w-full max-w-[180px]">
                  {dish.isPending ? (
                    <button
                      disabled
                      className="w-full bg-slate-200 text-slate-400 text-xs font-bold py-2 rounded-xl cursor-not-allowed"
                    >
                      保存中
                    </button>
                  ) : (
                    <>
                      <Link
                        href={`/menus/${dish.id}/edit`}
                        className="flex-1 bg-[#00b2fe] hover:bg-[#009de0] text-white text-xs font-bold py-2 rounded-xl transition-colors text-center block shadow-sm"
                      >
                        編集
                      </Link>
                      <DeleteButton dishId={dish.id} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}