'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header'; 
import Sidebar from '@/components/Sidebar'; 
import { createClient } from '@/utils/supabase/client'; 
import { updateProfile } from '../../actions'; 

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient(); // ✨ インスタンス化

  // 表示モード (false) と 編集モード (true) を管理
  const [isEditing, setIsEditing] = useState(false);

  // フォーム・表示用のState
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true); // ✨ NextAuthのloadingの代わり

  // ✨ 初回にSupabaseからユーザー情報を安全に取得する
  useEffect(() => {
    async function loadUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/login');
        return;
      }

      // メタデータから名前を取得し、なければemailの@前などをフォールバックにする
      setName(user.user_metadata?.name || '');
      setEmail(user.email || '');
      setIsLoading(false);
    }

    loadUser();
  }, [router, supabase]);

  const handleStartEdit = () => {
    setPassword(''); // 編集開始時はパスワード欄を空にする
    setIsEditing(true);
  };

  // 編集内容の保存処理
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // ✨ Server Action に FormData を渡して安全にDB/Authを更新
      const formData = new FormData();
      formData.append('name', name);
      formData.append('password', password);

      await updateProfile(formData);
      
      alert('プロフィールを更新しました！');
      setIsEditing(false); // 表示モードに戻す
      router.refresh(); // ヘッダー等の表示を最新に同期する
    } catch (error) { // ✨ (: any) を削除
      console.error(error);
      // ✨ error がオブジェクトであり、かつ message プロパティを持っているかチェックする
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('保存中にエラーが発生しました。');
      }
    }
  };

  // 読み込み中の画面表示
  if (isLoading) {
    return <div className="text-center p-10 text-white bg-[#54C7F3] min-h-screen">読み込み中...</div>;
  }

  return (
    <div className="bg-[#54C7F3] min-h-screen flex flex-col font-sans">
      <main className="flex-1 flex flex-col items-center py-8 px-4">
        {/* 上部：タイトルエリア */}
        <Header />
        

        {/* レイアウトエリア（左：サイドメニュー、右：メインカード） */}
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full px-4 items-start justify-center">
          
          {/* 左側：サイドメニュー */}
          <Sidebar />

          {/* 右側：メインカード */}
          <div className="bg-white rounded-2xl p-8 shadow-xl flex-1 w-full min-h-[250px] flex flex-col justify-center items-center">
            <h2 className="text-[#54C7F3] text-center text-2xl font-black mb-8 tracking-wider">
              プロフィール設定
            </h2>
            {!isEditing ? (
              /* =================【表示モード】================= */
              <div className="text-center space-y-3 w-full max-w-sm">
                <h3 className="text-2xl font-black text-gray-800 tracking-wide mb-4">{name}</h3>
                <p className="text-sm text-gray-600 font-medium">メールアドレス：{email}</p>
                <p className="text-sm text-gray-400 font-medium">パスワード：••••••••</p>
                
                <div className="pt-6">
                  <button
                    onClick={handleStartEdit}
                    className="bg-[#54C7F3] text-white font-bold text-xs px-6 py-2 rounded-lg shadow hover:bg-[#42b3de] transition"
                  >
                    変更する
                  </button>
                </div>
              </div>
            ) : (
              /* =================【編集モード】================= */
              <form onSubmit={handleSave} className="w-full max-w-xs space-y-4">
                {/* 名前入力 */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">名前</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#54C7F3] text-slate-800"
                    required
                  />
                </div>

                {/* メールアドレス（固定） */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 text-gray-400 rounded-xl cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 ml-1">※メールアドレスは変更できません</span>
                </div>

                {/* 新しいパスワード入力欄 */}
                <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 ml-1">新しいパスワード</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="変更する場合のみ入力"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#54C7F3] text-slate-800 placeholder:text-slate-300"
                  />
                </div>

                {/* 保存ボタン */}
                <div className="text-center pt-4">
                  <button
                    type="submit"
                    className="bg-[#54C7F3] text-white font-bold text-xs px-6 py-2 rounded-lg shadow hover:bg-[#42b3de] transition"
                  >
                    変更を保存する
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}