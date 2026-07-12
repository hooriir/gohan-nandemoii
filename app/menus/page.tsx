// app/menus/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createDish } from "../actions";
import DeleteButton from "@/components/DeleteButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export default async function MenusPage() {
  // 1. ログインチェックとユーザーデータ・料理一覧の取得
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      dishes: {
        include: { tags: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const dishes = user?.dishes ?? [];
  const userName = user?.name ?? "ゲスト";

  return (
    // 画面全体をブランドカラーの水色にする
    <div className="bg-brand-bg min-h-screen p-4 sm:p-8 flex flex-col items-center font-sans">
      
      {/* 上部ヘッダー（ロゴとログアウト） */}
      <Header />
      

      {/* メインコンテンツエリア（左メニュー ＋ 右コンテンツ） */}
      <div className="w-full max-w-[900px] flex flex-col md:flex-row gap-6 items-start">
        
        {/* 左側：サイドメニュー */}
        <Sidebar />

        {/* 右側：メインカード（登録フォーム ＆ 一覧） */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 w-full">
          
          {/* Section 1: ごはん登録 */}
          <div className="text-center mb-10 pb-10 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-700 flex flex-col items-center gap-1 mb-1">
              ごはん登録
              <span className="inline-block w-8 h-4 bg-sky-200 rounded-b-full"></span>
            </h2>
            <p className="text-[11px] font-bold text-slate-400 mb-6">いつも食べてるあのごはんを登録しとく</p>

            {/* 修正前：<form action={createDish} encType="multipart/form-data" className="..." */}
            {/* 修正後：encType を削除します */}
            <form action={createDish} className="max-w-[400px] mx-auto space-y-4 text-left">
              <input
                type="text"
                name="name"
                required
                placeholder="ごはん名"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-blue focus:bg-white transition-all placeholder:text-slate-300"
              />
              
              <input
                type="text"
                name="tagsInput"
                placeholder="キーワード（例：さっぱり 日本食）"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-blue focus:bg-white transition-all placeholder:text-slate-300"
              />

              <div className="flex items-center gap-3">
                {/* カスタムファイルインプット */}
                <label className="flex-1 bg-sky-400 hover:bg-sky-500 text-white text-xs font-bold text-center py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm">
                  画像アップロード
                  <input type="file" name="imageFile" accept="image/*" className="hidden" />
                </label>
                
                <div className="w-[100px]">
                  <Button type="submit" text="登録" variant="red" />
                </div>
              </div>
              <p className="text-[9px] text-slate-400 text-center">jpeg, png, gif（10MB以内）</p>
            </form>
          </div>

          {/* Section 2: ごはん一覧 */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-base font-black text-slate-700 flex flex-col items-center gap-1 mb-1">
                ごはん一覧
                <span className="inline-block w-8 h-4 bg-sky-200 rounded-b-full"></span>
              </h2>
            </div>

            {dishes.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">登録された料理はまだありません。</p>
            ) : (
              // イメージ画像通りのきれいな3列グリッド表示
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dishes.map((dish) => (
                  <div key={dish.id} className="flex flex-col items-center text-center">
                    
                    {/* 画像枠エリア */}
                    <div className="w-full aspect-square bg-slate-50 border border-brand-blue/20 rounded-2xl overflow-hidden relative shadow-inner mb-3">
                      {dish.imageUrl ? (
                        <Image
                          src={dish.imageUrl}
                          alt={dish.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        // 画像がない場合のプレースホルダー
                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                          <span className="text-xs font-bold">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* 料理名とタグ */}
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{dish.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mb-3 min-h-[15px]">
                      {dish.tags.map(t => `#${t.name}`).join(" ")}
                    </p>

                    {/* 操作ボタン（コピー / 削除） */}
                        <div className="flex gap-2 w-full max-w-[140px]">
                        <button className="flex-1 bg-sky-400 hover:bg-sky-500 text-white text-[10px] font-bold py-1 px-2 rounded shadow-sm transition-colors">
                            コピー
                        </button>

                        {/* ★ エラーの起きたフォームを消して、コンポーネントに差し替え */}
                        <DeleteButton dishId={dish.id} />
                        </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}