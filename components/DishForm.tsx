"use client"; // ✨ クライアント側で動かすための宣言

import { useState, ChangeEvent } from "react";
import Button from "./Button";
import { createDish } from "@/app/actions";

export default function DishForm() {
  // 選択されたファイル名を管理する状態（State）
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFileName(files[0].name); // ファイル名を設定
    } else {
      setFileName(""); // キャンセルされた場合はクリア
    }
  };

  return (
    <form action={createDish} className="max-w-[400px] mx-auto space-y-4 text-left">
      <input
        type="text"
        name="name"
        required
        placeholder="ごはん名"
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-blue focus:bg-white transition-all placeholder:text-slate-300"
      />
      
      <input
        type="text"
        name="tagsInput"
        placeholder="キーワード（例：さっぱり 日本食）"
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-brand-blue focus:bg-white transition-all placeholder:text-slate-300"
      />

      <div className="flex items-start gap-3">
        {/* 左側：アップロードボタンと注記の縦並びグループ */}
        <div className="flex-1 flex flex-col gap-1">
          <label className="w-full bg-sky-400 hover:bg-sky-500 text-white text-xs font-bold text-center mt-4 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm">
            画像アップロード
            <input 
              type="file" 
              name="imageFile" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} // ✨ ファイル選択時に動く関数を指定
            />
          </label>
          
          {/* ✨ ファイルが選ばれていればファイル名を、なければいつもの注記を表示 */}
          {fileName ? (
            <p className="text-[9px] text-sky-400 font-bold pl-1 truncate max-w-[250px]">
              選択中: {fileName}
            </p>
          ) : (
            <p className="text-[9px] text-slate-400 pl-1 text-center">
              jpeg, png, gif（10MB以内）
            </p>
          )}
        </div>
        
        {/* 右側：登録ボタン */}
        <div className="w-[100px]">
          <Button type="submit" text="登録" variant="red" />
        </div>
      </div>
    </form>
  );
}