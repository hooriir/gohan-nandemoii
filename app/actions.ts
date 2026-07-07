"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 入力チェック
  if (!name || !email || !password) {
    redirect("/register?error=すべての項目を入力してください");
  }

  try {
    // 1. すでに同じメールアドレスが登録されていないか確認
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      redirect("/register?error=このメールアドレスはすでに登録されています");
    }

    // 2. パスワードを暗号化（ハッシュ化）する
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. データベースにユーザーを作成
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

  } catch (error) {
    // redirectは内部的にエラーを投げる仕様のため、キャッチした後にそのまま通す必要があります
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("登録エラー:", error);
    redirect("/register?error=登録処理に失敗しました");
  }

  // 4. 登録が完了したら、元々作ってあるログイン画面（ルート想定）へ移動
  // ※ もしログイン画面のURLが「/login」などの場合は、以下を変更してください
  redirect("/");
}