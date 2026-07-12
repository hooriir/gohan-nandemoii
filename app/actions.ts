// app/actions.ts
"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { z } from "zod"; 
import { getServerSession } from "next-auth";
import { supabase } from "@/lib/supabase";

// ★ 入力値のルール（スキーマ）を定義する
const registerSchema = z.object({
  name: z
    .string()
    .min(1, { message: "お名前を入力してください" })
    .max(20, { message: "お名前は20文字以内で入力してください" }),
  email: z
    .string()
    .min(1, { message: "メールアドレスを入力してください" })
    .email({ message: "正しいメールアドレスの形式で入力してください" }),
  password: z
    .string()
    .min(6, { message: "パスワードは6文字以上で入力してください" })
    .max(100),
});

export async function registerUser(formData: FormData) {
  // 1. フォームのデータをオブジェクト形式にまとめる
  const rawData = Object.fromEntries(formData.entries());

  // 2. Zodでチェックを実行
  const validatedFields = registerSchema.safeParse(rawData);

  // 3. もしルールに違反していたら、処理を中断してエラーにする
  if (!validatedFields.success) {
    // validatedFields.error.issues からエラーメッセージを取り出す
    const errorMessages = validatedFields.error.issues
      .map((issue) => issue.message)
      .join(", ");
      
    throw new Error(`入力内容に不備があります: ${errorMessages}`);
  }

  // 4. チェックに合格した安全なデータを取り出す
  const { name, email, password } = validatedFields.data;

  // ※メールアドレスの重複チェックも入れておくとさらに安全です！
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("このメールアドレスは既に登録されています");
  }

  // 5. パスワードをハッシュ化して保存
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, password: hashedPassword }
  });

  redirect("/login");
}

// バリデーションルール（画像を受け取れるように変更）
const dishSchema = z.object({
  name: z.string().min(1, { message: "ごはん名を入力してください" }).max(50),
  tagsInput: z.string().optional(),
  imageFile: z.instanceof(File).optional(), // ★ 画像ファイル用の定義を追加
});

export async function createDish(formData: FormData) {
  // 1. ログイン中のユーザー情報を取得
  const session = await getServerSession();
  if (!session?.user?.email) {
    throw new Error("認証が必要です。ログインしてください。");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("ユーザーが見つかりません");

  // 2. フォームデータのバリデーション
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = dishSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map((i) => i.message).join(", ");
    throw new Error(`入力内容に不備があります: ${errorMessages}`);
  }

  const { name, tagsInput, imageFile } = validatedFields.data;

  // 3. 画像のアップロード処理（選択されている場合のみ）
  let imageUrl: string | null = null;
  
  if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
    // ファイル名が重複しないようにユニークな名前を生成
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    // File オブジェクトを ArrayBuffer に変換して Supabase に送る
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from("dish-images")
      .upload(fileName, buffer, {
        contentType: imageFile.type,
        upsert: true
      });

    if (error) {
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
    }

    // アップロードした画像の公開URLを取得して変数に格納
    const { data: publicUrlData } = supabase.storage
      .from("dish-images")
      .getPublicUrl(fileName);
      
    imageUrl = publicUrlData.publicUrl;
  }

  // 4. タグの文字列を配列に分解・整形
  const tagNames = tagsInput
    ? tagsInput
        .replace(/[,，、]/g, " ")
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  // 5. データベースへ保存（imageUrl も一緒に保存）
  await prisma.dish.create({
    data: {
      name,
      userId: user.id,
      imageUrl: imageUrl, // ★ 画像URLを保存
      tags: {
        connectOrCreate: tagNames.map((tagName) => ({
          where: { name: tagName },
          create: { name: tagName },
        })),
      },
    },
  });

  // 6. 今回は1画面にまとめるため、同じ画面（/menus）にリダイレクト
  redirect("/menus");
}

// app/actions.ts の一番下に追加

export async function deleteDish(formData: FormData) {
  // 1. ログインチェック
  const session = await getServerSession();
  if (!session?.user?.email) {
    throw new Error("認証が必要です。");
  }

  const dishId = formData.get("dishId") as string;
  if (!dishId) throw new Error("料理IDが正しくありません");

  // 2. 削除する料理が本当にこのユーザーのものか確認し、画像URLも取得
  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    include: { user: true }
  });

  if (!dish || dish.user.email !== session.user.email) {
    throw new Error("削除する権限がありません");
  }

  // 3. Supabase Storage から画像ファイルを削除（画像が存在する場合のみ）
  if (dish.imageUrl) {
    // URLからファイル名部分（例: cmra5...png）だけを抽出
    const fileName = dish.imageUrl.split("/").pop();
    if (fileName) {
      await supabase.storage
        .from("dish-images")
        .remove([fileName]);
    }
  }

  // 4. データベースから料理を削除
  await prisma.dish.delete({
    where: { id: dishId },
  });

  // 5. 画面を更新
  redirect("/menus");
}