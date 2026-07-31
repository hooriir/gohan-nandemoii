import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/server";
import MenuListManager from "@/components/MenuListManager";

export default async function MenusPage() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) {
    redirect("/login");
  }

  const dishes = await prisma.dish.findMany({
    where: { userId: supabaseUser.id },
    include: { tags: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-brand-bg min-h-screen p-4 sm:p-8 flex flex-col items-center font-sans">
      <Header />
      
      <div className="w-full max-w-[900px] flex flex-col md:flex-row gap-6 items-start">
        <Sidebar />

        <div className="flex-1 bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 w-full">
          <h2 className="text-[#54C7F3] text-center text-2xl font-black mb-8 tracking-wider">
            ごはん登録・一覧
          </h2>

          <MenuListManager initialDishes={dishes} />

        </div>
      </div>
    </div>
  );
}