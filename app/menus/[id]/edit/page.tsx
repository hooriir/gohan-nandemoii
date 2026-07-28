import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Button from "@/components/Button";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMenuPage({ params }: EditPageProps) {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  if (!supabaseUser || !supabaseUser.email) {
    redirect("/login");
  }
  const { id } = await params;
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: { tags: true },
  });

  if (!dish) {
    notFound();
  }

  const tagsString = dish?.tags.map((t) => t.name).join(" ") ?? "";

  async function updateDish(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    const tagsInput = formData.get("tagsInput") as string;
    const imageFile = formData.get("image") as File; // ← 追加: フォームから画像ファイルを取得

    if (!name) return;

    let imageUrl = dish?.imageUrl ?? null;

    if (imageFile && imageFile.size > 0) {
      const supabase = await createClient();
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}-${Date.now()}.${fileExt}`;
      
      // Supabaseの dish-images バケットにアップロード
      const { error } = await supabase.storage
        .from("dish-images")
        .upload(fileName, imageFile);

      if (error) {
        console.error("画像のアップロードに失敗しました:", error);
        return;
      }


      const { data: { publicUrl } } = supabase.storage
        .from("dish-images")
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    // データベースを更新
    await prisma.dish.update({
      where: { id },
      data: {
        name,
        imageUrl,
        tags: {
          set: [], // 一度クリア
          connectOrCreate: tagsInput
            .split(/\s+/)
            .filter(Boolean)
            .map((tagName) => ({
              where: { name: tagName },
              create: { name: tagName },
            })),
        },
      },
    });

    redirect("/menus");
  }

  return (
    <div className="bg-brand-bg min-h-screen p-4 sm:p-8 flex flex-col items-center font-sans">
      <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-xl p-6 sm:p-10 border border-slate-100 mt-10">
        <h2 className="text-[#54C7F3] text-center text-xl font-black mb-6 tracking-wider">
          ごはん情報を編集
        </h2>

        <form action={updateDish} className="space-y-4 text-left">

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              ごはんの写真（変更する場合のみ選択）
            </label>
            {dish?.imageUrl && (
                <div className="mb-2 text-xs text-slate-400">
                    現在の画像が登録されています。変更したい場合は下のボタンから新しい画像を選んでください。
                </div>
                )}
                <input
                type="file"
                name="image"
                accept="image/*"
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-600 hover:file:bg-sky-100 cursor-pointer"
                />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">ごはん名</label>
            <input
                type="text"
                name="name"
                required
                defaultValue={dish?.name} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-blue focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">キーワード</label>
            <input
              type="text"
              name="tagsInput"
              defaultValue={tagsString} 
              placeholder="キーワード（例：さっぱり 日本食）"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-blue focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4 items-center">
            <Link
              href="/menus"
              className="flex-1 border-2 border-sky-400 hover:bg-sky-100 text-sky-400 font-bold text-center mt-4 py-3 rounded-lg transition-colors leading-normal"
            >
              キャンセル
            </Link>
            <div className="flex-1">
              <Button type="submit" text="変更を保存" variant="blue" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}