import Image from "next/image";
import { registerUser } from "../actions";
import Button from "@/components/Button";

export default function RegisterPage() {
  return (
    <div className="bg-brand-bg min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-[400px] text-center">
        
        <h1 className="flex justify-center mb-2">
          <Image
            src="/images/gohan_bl.svg"
            alt="ごはん？なんでもいい～"
            width={160}
            height={72}          
          />
        </h1>
        
        <h2 className="text-xl font-bold text-slate-700 mb-8">新規登録</h2>

        {/* registerUser が何も返さなくなったため、直接渡すだけで型エラーが消えます */}
        <form action={registerUser} className="space-y-5 text-left">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">お名前</label>
            <input
              type="text"
              name="name"
              required
              placeholder="ごはん 太郎"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-800 placeholder:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">メールアドレス</label>
            <input
              type="email"
              name="email"
              required
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-800 placeholder:text-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">パスワード</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all text-slate-800 placeholder:text-slate-300"
            />
          </div>

          <Button type="submit" text="登録する" variant="red" />
          
        </form>
      </div>
    </div>
  );
}