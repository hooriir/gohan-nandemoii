"use client";

import React, { useRef, useState, useEffect } from "react";
import Button from "@/components/Button";
import { createDish } from "@/app/actions";
import { Dish } from "./MenuListManager";

interface DishFormProps {
  addOptimisticDish?: (dish: Dish) => void;
}

export default function DishForm({ addOptimisticDish }: DishFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAction = async (formData: FormData) => {
    if (isSubmitting) return;

    const name = formData.get("name") as string;
    const tagsInput = formData.get("tagsInput") as string;
    const imageFile = formData.get("imageFile") as File;

    if (!name) return;

    setIsSubmitting(true);

    try {
      const tags = tagsInput
        ? tagsInput
            .replace(/[,，、]/g, " ")
            .split(/\s+/)
            .filter(Boolean)
            .map((t, idx) => ({ id: `temp-tag-${idx}`, name: t }))
        : [];

      let localImageUrl = previewUrl;
      if (imageFile && imageFile.size > 0 && imageFile.name !== "undefined") {
        localImageUrl = URL.createObjectURL(imageFile);
      }

      if (addOptimisticDish) {
        addOptimisticDish({
          id: `temp-${Date.now()}`,
          name: name,
          imageUrl: localImageUrl,
          tags: tags,
          isPending: true,
        });
      }

      formRef.current?.reset();
      setPreviewUrl(null);

      await createDish(formData);
    } catch (error: unknown) {
      // ⭕ 型ガードを行って NEXT_REDIRECT の例外を無視する
      if (
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string" &&
        (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        return;
      }

      console.error("料理の登録に失敗しました:", error);
      alert("登録中にエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} action={handleAction} className="flex flex-col gap-4 max-w-sm mx-auto">
      <div>
        <input
          type="text"
          name="name"
          placeholder="ごはん名 (例: カレーライス)"
          required
          disabled={isSubmitting}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54C7F3] text-sm text-slate-700 placeholder-slate-400 disabled:bg-slate-50"
        />
      </div>

      <div>
        <input
          type="text"
          name="tagsInput"
          placeholder="キーワード (スペース区切りで複数可)"
          disabled={isSubmitting}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54C7F3] text-sm text-slate-700 placeholder-slate-400 disabled:bg-slate-50"
        />
      </div>

      <div>
        <input
          type="file"
          name="imageFile"
          accept="image/*"
          disabled={isSubmitting}
          onChange={handleImageChange}
          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#e3f2fd] file:text-[#00b2fe] hover:file:bg-[#d0e8fc] cursor-pointer disabled:opacity-50"
        />
      </div>

      {previewUrl && (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="プレビュー" className="w-full h-full object-cover" />
        </div>
      )}

      <Button 
        text={isSubmitting ? "登録中..." : "登録する"} 
        type="submit" 
        variant="red" 
        disabled={isSubmitting}
      />
    </form>
  );
}