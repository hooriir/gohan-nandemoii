import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  // 1. Supabaseからログインユーザーを取得
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login"); // 未ログインならログインへ
  }

  // 2. PrismaのUser情報を取得
  const dbUser = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
  });

  if (!dbUser) {
    return <div className="p-8 text-center">ユーザー情報が見つかりません。</div>;
  }

  // 3. 履歴（DishShowLog）を新しい順に取得
  const logs = await prisma.dishShowLog.findMany({
    where: { userId: dbUser.id },
    include: {
      dish: true, // 紐づくごはん情報も一緒に持ってくる
    },
    orderBy: {
      createdAt: "desc", // 最新の提案が一番上
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
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded-lg text-xl">
                  🍽️
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{log.dish.name}</h3>
                <p className="text-sm text-gray-500">
                  入力キー: <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{log.keyword}</span>
                </p>
              </div>
              <div className="text-right text-xs text-gray-400">
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