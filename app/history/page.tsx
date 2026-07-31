import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
  });

  if (!dbUser) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-gray-600">
        ユーザー情報が見つかりません。
      </div>
    );
  }

  const logs = await prisma.dishShowLog.findMany({
    where: { userId: dbUser.id },
    include: {
      dish: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">🍛 これまでの提案履歴</h1>

      {logs.length === 0 ? (
        <p className="text-gray-500 text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
          まだ履歴がありません。たくさん提案をもらいましょう！
        </p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const dishName = log.dish?.name || "おすすめ料理";
            const imageUrl = log.dish?.imageUrl || null;

            return (
              <div 
                key={log.id} 
                className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow"
              >
                {imageUrl ? (
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0 bg-slate-50">
                    <Image
                      src={imageUrl}
                      alt={dishName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-lg text-2xl flex-shrink-0">
                    🍽️
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-lg truncate">
                    {dishName}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    キーワード:{" "}
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">
                      {log.keyword || "指定なし"}
                    </span>
                  </p>
                </div>

                <div className="text-right text-xs text-slate-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}