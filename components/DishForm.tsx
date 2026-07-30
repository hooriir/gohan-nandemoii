// components/DishForm.tsx
"use client";

import React, { useRef, useState } from "react";
import Button from "@/components/Button"; // お使いのButtonコンポーネントのパス
import { createDish } from "@/app/actions";
import { Dish } from "./MenuListManager";

interface DishFormProps {
  addOptimisticDish?: (dish: Dish) => void;
}

export default function DishForm({ addOptimisticDish }: DishFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 画像選択時にローカルプレビュー作成
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAction = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const tagsInput = formData.get("tagsInput") as string;
    const imageFile = formData.get("imageFile") as File;

    if (!name) return;

    // 1. タグの仮データ作成
    const tags = tagsInput
      ? tagsInput
          .replace(/[,，、]/g, " ")
          .split(/\s+/)
          .filter(Boolean)
          .map((t, idx) => ({ id: `temp-tag-${idx}`, name: t }))
      : [];

    // 2. 選択した画像のプレビューURLをセット
    let localImageUrl = previewUrl;
    if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
      localImageUrl = URL.createObjectURL(imageFile);
    }

    // 3. 楽観的UI更新（渡されている場合）
    if (addOptimisticDish) {
      addOptimisticDish({
        id: `temp-${Date.now()}`,
        name: name,
        imageUrl: localImageUrl,
        tags: tags,
        isPending: true,
      });
    }

    // 4. フォーム入力のリセット
    formRef.current?.reset();
    setPreviewUrl(null);

    // 5. 本物の Server Action 実行
    await createDish(formData);
  };

  return (
    <form ref={formRef} action={handleAction} className="flex flex-col gap-4 max-w-sm mx-auto">
      {/* ごはん名入力 */}
      <div>
        <input
          type="text"
          name="name"
          placeholder="ごはん名 (例: カレーライス)"
          required
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54C7F3] text-sm text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* タグ入力 */}
      <div>
        <input
          type="text"
          name="tagsInput"
          placeholder="キーワード (スペース区切りで複数可)"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54C7F3] text-sm text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* 画像ファイル選択 */}
      <div>
        <input
          type="file"
          name="imageFile"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#e3f2fd] file:text-[#00b2fe] hover:file:bg-[#d0e8fc] cursor-pointer"
        />
      </div>

      {/* 登録ボタン */}
      <Button text="登録する" type="submit" variant="red" />
    </form>
  );
}