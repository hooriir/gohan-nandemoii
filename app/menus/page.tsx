import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteButton from "@/components/DeleteButton";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/server";
import DishForm from "@/components/DishForm";

export default async function MenusPage() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
    include: {
      dishes: {
        include: { tags: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const dishes = user?.dishes ?? [];

  return (
    <div className="bg-brand-bg min-h-screen p-4 sm:p-8 flex flex-col items-center font-sans">
      
      <Header />
      
      <div className="w-full max-w-[900px] flex flex-col md:flex-row gap-6 items-start">
        
        <Sidebar />

        <div className="flex-1 bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 w-full">
          <h2 className="text-[#54C7F3] text-center text-2xl font-black mb-8 tracking-wider">
            ごはん登録・一覧
          </h2>

          <div className="text-center mb-10 pb-10 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-700 flex flex-col items-center gap-1 mb-1">
              ごはん登録
            </h2>
            <p className="text-[11px] font-bold text-slate-400 mb-6">
              いつも食べてるあのごはんを登録しとく
            </p>

            <DishForm />
          </div>

          <div>
            <div className="text-center mb-8">
              <h2 className="text-base font-black text-slate-700 flex flex-col items-center gap-1 mb-1">
                ごはん一覧
              </h2>
            </div>

            {dishes.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">
                登録された料理はまだありません。
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {dishes.map((dish) => (
                  <div key={dish.id} className="flex flex-col items-center text-center">
                    
                    {/* 画像領域 */}
                    <div className="w-full aspect-square bg-[#f4f9fd] border-2 border-[#e3f2fd] rounded-3xl overflow-hidden relative mb-3 flex items-center justify-center">
                      {dish.imageUrl ? (
                        <Image
                          src={dish.imageUrl}
                          alt={dish.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
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
                    </h3>

                    {/* ハッシュタグ */}
                    <p className="text-xs text-slate-400 font-bold mb-4 min-h-[18px] flex flex-wrap justify-center gap-1">
                      {dish.tags.length > 0 ? (
                        dish.tags.map((t) => (
                          <span key={t.id}>#{t.name}</span>
                        ))
                      ) : (
                        <span className="text-slate-300">#タグなし</span>
                      )}
                    </p>

                    {/* ボタン群 */}
                    <div className="flex gap-3 w-full max-w-[180px]">
                      <Link 
                        href={`/menus/${dish.id}/edit`} 
                        className="flex-1 bg-[#00b2fe] hover:bg-[#009de0] text-white text-xs font-bold py-2 rounded-xl transition-colors text-center block shadow-sm"
                      >
                        編集
                      </Link>
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