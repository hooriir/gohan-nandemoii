// app/actions.ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod"; 
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

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

/**
 * 1. ユーザー新規登録 (Supabase Auth)
 */
export async function registerUser(formData: FormData) {
  const supabase = await createClient();

  // 1. フォームのデータをオブジェクト形式にまとめる
  const rawData = Object.fromEntries(formData.entries());

  // 2. Zodでチェックを実行
  const validatedFields = registerSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues
      .map((issue) => issue.message)
      .join(", ");
    throw new Error(`入力内容に不備があります: ${errorMessages}`);
  }

  const { name, email, password } = validatedFields.data;

  // 3. Supabase Auth でユーザー作成（暗号化や重複チェックはSupabase側が自動で行います）
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name, // メタデータとして名前を保存
      },
    },
  });

  if (error) {
    throw new Error(`新規登録に失敗しました: ${error.message}`);
  }

  redirect("/login");
}

/**
 * 2. プロフィール・パスワード更新
 */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  // ログイン中かチェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインしていません");

  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  // ① 名前の更新
  if (name) {
    const { error: nameError } = await supabase.auth.updateUser({
      data: { name: name }
    });
    if (nameError) throw new Error(`名前の変更に失敗しました: ${nameError.message}`);
  }

  // ② パスワードの更新（入力がある場合のみ）
  if (password && password.trim() !== "") {
    const { error: passError } = await supabase.auth.updateUser({
      password: password
    });
    if (passError) throw new Error(`パスワードの変更に失敗しました: ${passError.message}`);
  }
}

// ごはん登録用のバリデーションルール
const dishSchema = z.object({
  name: z.string().min(1, { message: "ごはん名を入力してください" }).max(50),
  tagsInput: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
});

/**
 * 3. ごはんの作成 (Supabase Database + Storage)
 */
export async function createDish(formData: FormData) {
  const supabase = await createClient();

  // 1. ログイン中のユーザー情報を取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("認証が必要です。ログインしてください。");

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
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabase.storage
      .from("dish-images")
      .upload(fileName, buffer, {
        contentType: imageFile.type,
        upsert: true
      });

    if (error) {
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
    }

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

  // 5. ✨ Supabaseではなく、Prismaを使ってデータベースへ保存する形式に戻します
  try {
    // TypeScriptのエラーを防ぐため、確実にメールアドレスが存在することを確認・固定します
    const userEmail = user.email;
    if (!userEmail) {
      throw new Error("ユーザーのメールアドレスが取得できませんでした。");
    }

    await prisma.dish.create({
      data: {
        name,
        imageUrl,
        // ユーザーがいなければ自動で作成、いれば紐付ける
        user: {
          connectOrCreate: {
            where: { email: userEmail },
            create: { 
              email: userEmail,
              name: user.user_metadata?.name || userEmail.split("@")[0] || "ユーザー",
              password: "SUPABASE_AUTHENTICATED_USER" // ✨ Prismaの必須エラーを回避するためのダミー値（ログインには使われません）
            }
          }
        },
        // タグがあれば、作成または既存のタグと紐付け
        tags: {
          connectOrCreate: tagNames.map((tagName) => ({
            where: { name: tagName },
            create: { name: tagName },
          })),
        },
      },
    });
  } catch (prismaError) {
    // 💡 any を外し、安全にエラーメッセージを取り出せるように型ガードを使います
    console.error("Prisma保存エラー:", prismaError);
    const errorMessage = prismaError instanceof Error ? prismaError.message : "不明なエラー";
    throw new Error(`データベースの保存に失敗しました: ${errorMessage}`);
  }

  // 登録が終わったらメニュー一覧へ戻る
  redirect("/menus");
}

/**
 * 4. ごはんの削除 (Supabase Database + Storage)
 */
export async function deleteDish(formData: FormData) {
  const supabase = await createClient();

  // 1. ログインチェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("認証が必要です。");

  const dishId = formData.get("dishId") as string;
  if (!dishId) throw new Error("料理IDが正しくありません");

  // 2. 削除する料理の情報を取得して、本人のものか確認
  const { data: dish, error: fetchError } = await supabase
    .from("dishes")
    .select("*")
    .eq("id", dishId)
    .single();

  if (fetchError || !dish || dish.user_id !== user.id) {
    throw new Error("削除する権限がないか、料理が見つかりません");
  }

  // 3. Storage から画像ファイルを削除
  if (dish.image_url) {
    const fileName = dish.image_url.split("/").pop();
    if (fileName) {
      await supabase.storage
        .from("dish-images")
        .remove([fileName]);
    }
  }

  // 4. データベースから削除
  const { error: deleteError } = await supabase
    .from("dishes")
    .delete()
    .eq("id", dishId);

  if (deleteError) {
    throw new Error(`料理の削除に失敗しました: ${deleteError.message}`);
  }

  redirect("/menus");
}

export async function signOutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}