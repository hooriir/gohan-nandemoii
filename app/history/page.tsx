import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
  });

  if (!dbUser) {
    return <div className="p-8 text-center">ユーザー情報が見つかりません。</div>;
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
      <h1 className="text-2xl font-bold mb-6">🍛 これまでの提案履歴</h1>

      {logs.length === 0 ? (
        <p className="text-gray-500 text-center py-8">まだ履歴がありません。たくさん提案をもらいましょう！</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 p-4 border rounded-xl shadow-sm bg-white">
              {log.dish.imageUrl ? (
                <Image
                  src={log.dish.imageUrl}
                  alt={log.dish.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-lg text-xl flex-shrink-0">
                  🍽️
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{log.dish.name}</h3>
                <p className="text-sm text-gray-500">
                  入力キー: <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{log.keyword}</span>
                </p>
              </div>
              <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}