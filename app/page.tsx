"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";

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

function HomePageContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  // 1. Supabaseから本当のログイン状態を取得する
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const isLoggedIn = !!userId;

  // 2. 表示ステート
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // ログインセッションの監視
  useEffect(() => {
    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
      setAuthChecking(false);
    }
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setAuthChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 検索・APIリクエスト処理
  const handleSearch = useCallback(async (searchKeyword: string) => {
  if (!userId) return;

  const cleanKeyword = searchKeyword.trim() || "なんでもいい";
  setKeyword(cleanKeyword);
  setHasSearched(true);
  setLoading(true);
  setError(null);

  try {
    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        keyword: cleanKeyword,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "メニューの決定に失敗しました。");
    }

    const data: RecommendResponse = await response.json();
    setResult(data);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
}, [userId]);
  
  useEffect(() => {
  const queryKeyword = searchParams.get("keyword");
  if (queryKeyword !== null) {
    const timer = setTimeout(() => {
      handleSearch(queryKeyword);
    }, 0);
    return () => clearTimeout(timer);
  }
}, [searchParams, handleSearch]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(keyword);
  };

  // 認証の確認中はローディング画面を挟む
  if (authChecking) {
    return (
      <div className="bg-[#53cbfb] min-h-screen flex flex-col items-center justify-center text-white font-bold text-lg">
        読み込み中...
      </div>
    );
  }

  return (
    /* 
      ログイン状態によって配置を切り替えます
      - 未ログイン時：justify-center（画面の上下中央に配置）
      - ログイン済：justify-start（画面上部から順番に配置）
    */
    <div className={`bg-[#53cbfb] min-h-screen flex flex-col items-center p-4 text-white font-sans select-none ${
      isLoggedIn ? "justify-start" : "justify-center"
    }`}>
      
      {/* 【ログインしていない場合】ヘッダーのみを画面中央に表示 */}
      {!isLoggedIn ? (
        <Header />
      ) : (
        /* 【ログインしている場合】ヘッダー ＋ 検索・結果エリア */
        <>
          <Header />

          {/* まだ検索していない時 */}
          {!hasSearched ? (
            <div className="w-full max-w-xl text-center py-12 flex flex-col items-center">
              <p className="text-2xl font-black mb-8 tracking-wider">今日のごはんは．．．？</p>
              
              <form onSubmit={onSubmit} className="w-full px-2 flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="さっぱり、こってり、なんでもいい..." 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl text-gray-800 bg-white shadow-md focus:outline-none text-center text-lg font-bold placeholder-gray-400"
                />
                <button 
                  type="submit"
                  className="w-full py-4 bg-[#e60012] hover:bg-[#c4000f] text-white font-black text-xl rounded-2xl shadow-lg transition-transform active:scale-95"
                >
                  これに決めた！
                </button>
              </form>
            </div>
          ) : (
            /* 検索中・結果表示時 */
            <div className="w-full max-w-xl flex flex-col items-center">
              <p className="text-xl md:text-2xl font-black mb-4 tracking-wider drop-shadow-sm">
                今日のごはんは...？
              </p>

              <div className="w-full bg-white rounded-3xl p-6 shadow-xl text-gray-800 text-center mb-6 border border-white/50">
                {loading ? (
                  <div className="py-16 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#53cbfb] mb-4"></div>
                    <p className="text-gray-500 font-bold">
                      {keyword === "なんでもいい" 
                        ? "AIシェフが今日の気分を分析中..." 
                        : `「${keyword}」から最高の1品を選び中...`}
                    </p>
                  </div>
                ) : error ? (
                  <div className="py-12 text-center">
                    <p className="text-red-500 font-bold mb-4">エラーが発生しました</p>
                    <p className="text-sm text-gray-600 mb-6">{error}</p>
                    <button 
                      onClick={() => handleSearch(keyword)}
                      className="px-6 py-2 bg-[#53cbfb] text-white rounded-full font-bold shadow hover:bg-[#42b7e6]"
                    >
                      もう一度試す
                    </button>
                  </div>
                ) : result ? (
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-[#54C7F3] mb-4 tracking-wide">
                      {result.dish.name}
                    </h2>

                    <div className="w-full h-56 md:h-64 rounded-2xl overflow-hidden mb-6 flex items-center justify-center bg-gray-50 border border-gray-100 relative">
                      {result.dish.imageUrl ? (
                        <Image 
                          src={result.dish.imageUrl} 
                          alt={result.dish.name} 
                          fill 
                          sizes="(max-width: 768px) 100vw, 500px" 
                          className="object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <span className="text-6xl mb-2">
                            <Image
                              src="/images/chawan.svg"
                              alt="茶碗"
                              width={80}
                              height={46}
                          />
                          </span>
                          <span className="text-xs">画像なくてもわかるよね</span>
                        </div>
                      )}
                    </div>

                    {result.reason && (
                      <div className="bg-[#54C7F3] border border-[#eeeeee] text-[#ffffff] p-4 rounded-xl text-left text-sm flex items-start gap-3 shadow-inner">
                        <span className="text-2xl mt-0.5">
                          <Image
                            src="/images/gohan.svg"
                            alt="ごはん"
                            width={40}
                            height={31}
                          />
                        </span>
                        <div>
                          <p className="font-bold text-[11px] text-[#ffffff] uppercase tracking-wider mb-0.5">
                            {result.isAiGeneration ? "AIごはんさんより" : "ごはんさんより"}
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

              <div className="w-full text-center mb-8 px-2">
                <h3 className="text-lg font-black mb-3 tracking-widest text-white drop-shadow-sm">
                  もう一回やる
                </h3>
                
                <form onSubmit={onSubmit} className="flex gap-2 w-full">
                  <input 
                    type="text" 
                    placeholder="ラストチャンス！" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    disabled={loading}
                    className="flex-grow px-4 py-3 rounded-xl text-gray-800 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-gray-400 font-bold"
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-[#e60012] hover:bg-[#c4000f] disabled:bg-gray-400 text-white font-black px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
                  >
                    これだ！
                  </button>
                </form>

                <button 
                  onClick={() => {
                    setHasSearched(false);
                    setKeyword("");
                    setResult(null);
                  }}
                  className="mt-6 text-sm font-bold underline hover:text-white/80"
                >
                  トップ（検索前）に戻る
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="bg-[#53cbfb] min-h-screen flex flex-col items-center justify-center text-white font-bold text-lg">
        読み込み中...
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}