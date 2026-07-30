"use server";

import { redirect } from "next/navigation";
import { z } from "zod"; 
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

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
  const supabase = await createClient();
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = registerSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues
      .map((issue) => issue.message)
      .join(", ");
    throw new Error(`入力内容に不備があります: ${errorMessages}`);
  }

  const { name, email, password } = validatedFields.data;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      },
    },
  });

  if (error) {
    throw new Error(`新規登録に失敗しました: ${error.message}`);
  }

  redirect("/login");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインしていません");

  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (name) {
    const { error: nameError } = await supabase.auth.updateUser({
      data: { name: name }
    });
    if (nameError) throw new Error(`名前の変更に失敗しました: ${nameError.message}`);
  }

  if (password && password.trim() !== "") {
    const { error: passError } = await supabase.auth.updateUser({
      password: password
    });
    if (passError) throw new Error(`パスワードの変更に失敗しました: ${passError.message}`);
  }
}

const dishSchema = z.object({
  name: z.string().min(1, { message: "ごはん名を入力してください" }).max(50),
  tagsInput: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
});


export async function createDish(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    throw new Error("認証が必要です。ログインしてください。");
  }

  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = dishSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map((i) => i.message).join(", ");
    throw new Error(`入力内容に不備があります: ${errorMessages}`);
  }
  const { name, tagsInput, imageFile } = validatedFields.data;

  let imageUrl: string | null = null;
  
  if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("dish-images")
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        upsert: true,
      });

    if (error) {
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("dish-images")
      .getPublicUrl(fileName);
      
    imageUrl = publicUrlData.publicUrl;
  }

  const tagNames = tagsInput
    ? tagsInput
        .replace(/[,，、]/g, " ")
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  try {
    let tagConnectIds: { id: string }[] = [];

    if (tagNames.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: { name: { in: tagNames } },
        select: { id: true, name: true },
      });

      const existingNames = existingTags.map((t) => t.name);
      const newNames = tagNames.filter((name) => !existingNames.includes(name));

      if (newNames.length > 0) {
        await prisma.tag.createMany({
          data: newNames.map((name) => ({ name })),
          skipDuplicates: true,
        });
      }

      const allTags = await prisma.tag.findMany({
        where: { name: { in: tagNames } },
        select: { id: true },
      });

      tagConnectIds = allTags.map((t) => ({ id: t.id }));
    }

    await prisma.dish.create({
      data: {
        name,
        imageUrl,
        userId: user.id,
        tags: {
          connect: tagConnectIds,
        },
      },
    });
  } catch (prismaError) {
    console.error("Prisma保存エラー:", prismaError);
    const errorMessage = prismaError instanceof Error ? prismaError.message : "不明なエラー";
    throw new Error(`データベースの保存に失敗しました: ${errorMessage}`);
  }

  redirect("/menus");
}


export async function deleteDish(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("認証が必要です。ログインしてください。");
  }

  const dishId = formData.get("dishId") as string;
  if (!dishId) {
    throw new Error("料理IDが正しくありません");
  }

  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
  });

  if (!dish) {
    throw new Error("料理が見つかりません");
  }

  if (dish.userId !== user.id) {
    throw new Error("削除する権限がありません");
  }

  if (dish.imageUrl) {
    const fileName = dish.imageUrl.split("/").pop();
    if (fileName) {
      const { error: storageError } = await supabase.storage
        .from("dish-images")
        .remove([fileName]);
      
      if (storageError) {
        console.error("Storage削除エラー:", storageError.message);
      }
    }
  }

  try {
    await prisma.dish.delete({
      where: { id: dishId },
    });
  } catch (prismaError) {
    console.error("Prisma削除エラー:", prismaError);
    const errorMessage = prismaError instanceof Error ? prismaError.message : "不明なエラー";
    throw new Error(`データベースからの削除に失敗しました: ${errorMessage}`);
  }

  redirect("/menus");
}