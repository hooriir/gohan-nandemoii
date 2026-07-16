"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Dish {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface RecommendResponse {
  dish: Dish;
  reason: string;
  isAiGeneration: boolean;
}

// 検索結果ページのメインコンテンツ（useSearchParamsを使用するためSuspense内に入れる必要があります）
function SearchResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URLパラメータからキーワードを取得。デフォルト値は「なんでもいい」
  const urlKeyword = searchParams.get("keyword") || "なんでもいい";

  // テスト用の仮ユーザーID
  // 認証機能（Supabase Authなど）を実装した後は、そちらから取得した本物のユーザーIDに置き換えてください。
  const tempUserId = "current-user-id"; 

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 「もう一回やる」用の入力値フォームステート
  const [inputKeyword, setInputKeyword] = useState("");

  // APIを呼び出してメニューを決定・履歴保存する関数
  const fetchRecommendation = async (searchKeyword: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: tempUserId,
          keyword: searchKeyword,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "メニューの決定に失敗しました。");
      }

      const data: RecommendResponse = await response.json();
      setResult(data);
    } catch (err) {
      // 💡 any を外し、安全にエラーメッセージを取り出せるように型ガードを使います
      const errorMessage = err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

// ページ初期ロード時に検索を実行
  useEffect(() => {
    let isMounted = true;

    const startFetch = async () => {
      // 警告を避けるため、一瞬だけ処理を遅らせるか、
      // または直接非同期処理の中でステートを更新します
      if (isMounted) {
        fetchRecommendation(urlKeyword);
      }
    };

    startFetch();

    return () => {
      isMounted = false;
    };
  }, [urlKeyword]);

  // 「これだ！」ボタン（再検索）を押した時の処理
  const handleSearchAgain = (e: React.FormEvent) => {
    e.preventDefault();
    const targetKeyword = inputKeyword.trim() || "なんでもいい";
    
    // URLのパラメータも更新しつつ、APIを再呼び出し
    router.push(`/search-result?keyword=${encodeURIComponent(targetKeyword)}`);
    fetchRecommendation(targetKeyword);
    setInputKeyword(""); // 入力欄をクリア
  };

  return (
    <div className="bg-[#53cbfb] min-h-screen flex flex-col items-center justify-start p-4 text-white font-sans select-none">
      
      {/* 1. ヘッダーエリア (タイトル & マイページ・ログアウト) */}
      <div className="w-full max-w-xl flex justify-between items-start mt-6 mb-8 px-2">
        <div className="flex flex-col text-left">
          <span className="text-sm md:text-base font-bold tracking-wider text-white/90">ごはん えらびさんの</span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mt-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.1)]">
            ごはん？
          </h1>
          <span className="text-lg md:text-xl font-bold mt-1 tracking-wider text-white/95">
            〜 なんでもいい〜 〜
          </span>
        </div>
        
        {/* 右上のマイページキャラクターとログアウトボタン */}
        <div className="flex flex-col items-center">
          <div className="relative flex flex-col items-center">
            {/* キャラクター（どんぶり赤顔くん）風のカスタムCSSスタイリング */}
            <div className="w-20 h-12 bg-white rounded-b-full border-t-[3px] border-red-500 flex items-center justify-center shadow-md relative mt-5">
              
              {/* 赤い顔 */}
              <div className="absolute -top-7 w-11 h-11 bg-red-600 rounded-full flex flex-col items-center justify-center border-2 border-white shadow">
                <div className="flex gap-2 mt-1.5">
                  <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                  <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                </div>
                <div className="w-3.5 h-1.5 bg-black rounded-full mt-1.5"></div>
              </div>
              
              <span className="text-[10px] font-black text-gray-700 mt-4 tracking-tighter">マイページ</span>
            </div>
            
            {/* ログアウト吹き出しボタン */}
            <button className="mt-2 px-3 py-1 bg-white text-gray-800 text-xs font-black rounded shadow hover:bg-gray-100 transition relative">
              ログアウト
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. サブコピー */}
      <p className="text-xl md:text-2xl font-black mb-4 tracking-wider drop-shadow-sm">
        今日のごはんは...？
      </p>

      {/* 3. 結果カードエリア */}
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-xl text-gray-800 text-center mb-6 border border-white/50">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#53cbfb] mb-4"></div>
            <p className="text-gray-500 font-bold">
              {urlKeyword === "なんでもいい" 
                ? "AIシェフが今日の気分を分析中..." 
                : `「${urlKeyword}」から最高の1品を選び中...`}
            </p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-500 font-bold mb-4">エラーが発生しました</p>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => fetchRecommendation(urlKeyword)}
              className="px-6 py-2 bg-[#53cbfb] text-white rounded-full font-bold shadow hover:bg-[#42b7e6]"
            >
              もう一度試す
            </button>
          </div>
        ) : result ? (
          <div>
            {/* ごはん名 */}
            <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-4 tracking-wide">
              {result.dish.name}
            </h2>

            {/* ごはん画像 */}
            <div className="w-full h-56 md:h-64 rounded-2xl overflow-hidden mb-6 flex items-center justify-center bg-gray-50 border border-gray-100 relative">
              {result.dish.imageUrl ? (
                <Image 
                    src={result.dish.imageUrl} 
                    alt={result.dish.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, 500px" 
                    className="object-cover"
                />
              ) : (
                // 画像未登録時のプレースホルダー
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <span className="text-6xl mb-2">🍲</span>
                  <span className="text-xs">おいしいごはん</span>
                </div>
              )}
            </div>

            {/* 4. AIシェフのアドバイスバルーン */}
            {result.reason && (
              <div className="bg-[#fef9eb] border border-[#f5e4bd] text-[#785129] p-4 rounded-xl text-left text-sm flex items-start gap-3 shadow-inner">
                <span className="text-2xl mt-0.5">🧑‍🍳</span>
                <div>
                  <p className="font-bold text-[11px] text-[#b87d4b] uppercase tracking-wider mb-0.5">
                    AIシェフより
                  </p>
                  <p className="leading-relaxed font-semibold">
                    {result.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* 5. 下部フォームエリア (もう一回やる & ラストチャンス) */}
      <div className="w-full max-w-xl text-center mb-8 px-2">
        <h3 className="text-lg font-black mb-3 tracking-widest text-white drop-shadow-sm">
          もう一回やる
        </h3>
        
        <form onSubmit={handleSearchAgain} className="flex gap-2 w-full">
          <input 
            type="text" 
            placeholder="ラストチャンス！" 
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            disabled={loading}
            className="flex-grow px-4 py-3 rounded-xl text-gray-800 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-gray-400 font-bold"
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-[#e60012] hover:bg-[#c4000f] disabled:bg-gray-400 text-white font-black px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            これだ！
          </button>
        </form>
      </div>

    </div>
  );
}

// Next.jsのビルド時エラー(deopt)を防ぐため、useSearchParamsを使うコンポーネントはSuspenseでラップします。
export default function SearchResultPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#53cbfb] min-h-screen flex flex-col items-center justify-center text-white font-bold text-lg">
        読み込み中...
      </div>
    }>
      <SearchResultContent />
    </Suspense>
  );
}