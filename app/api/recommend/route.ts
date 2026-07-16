import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

// インスタンスの初期化
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();

    // 1. Supabaseからログインユーザーを取得
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser || !supabaseUser.email) {
      return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 });
    }

    // 2. メールアドレスを元に、PrismaからUserとそれに紐づくDishesを取得
    const userWithDishes = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
      include: {
        dishes: {
          include: { tags: true }
        }
      }
    });

    if (!userWithDishes) {
      return NextResponse.json({ error: 'ユーザー情報が見つかりません。' }, { status: 404 });
    }

    const userDishes = userWithDishes.dishes ?? [];

    if (userDishes.length === 0) {
      return NextResponse.json({ 
        error: 'まずは好きなメニューをいくつか登録してください！' 
      }, { status: 400 });
    }

    // 🌟 3. 1週間前の日時を計算し、重複除外フィルターをかける
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 過去7日間に表示されたごはんのIDを履歴から取得
    const recentLogs = await prisma.dishShowLog.findMany({
      where: {
        userId: userWithDishes.id,
        createdAt: {
          gte: oneWeekAgo // 7日前 〜 現在まで
        }
      },
      select: {
        dishId: true
      }
    });

    const recentDishIds = recentLogs.map(log => log.dishId);

    // 1週間以内に表示されていないごはんだけを候補にする
    let availableDishes = userDishes.filter(dish => !recentDishIds.includes(dish.id));

    // セーフティガード：もし全てのごはんが1週間以内に表示済みだった場合は、全件を候補に戻す
    if (availableDishes.length === 0) {
      availableDishes = userDishes;
    }

    const cleanKeyword = keyword?.trim() || '';
    let selectedDishId: string | null = null;
    let aiReason: string | null = null;

    // --- Aパターン：「なんでもいい」または「空欄」の場合（AIが提案） ---
    if (cleanKeyword === 'なんでもいい' || cleanKeyword === '') {
      // 1週間以内に表示されていない候補からAIに渡す
      const dishListForAI = availableDishes.map(d => ({
        id: String(d.id), // IDを確実に文字列として渡す
        name: d.name,
        tags: d.tags.map(t => t.name)
      }));

      const prompt = `
        あなたは家族の夕飯を決めるプロのシェフです。
        ユーザーは「何が食べたいか分からない（なんでもいい）」状態です。
        以下のメニューリストの中から、今日の晩ご飯にぴったりなものを【1つだけ】選んでください。
        
        【メニューリスト】
        ${JSON.stringify(dishListForAI)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // スキーマを固定して、AIに余計なテキストを返させない（パースエラー防止）
          responseSchema: {
            type: "object",
            properties: {
              selectedDishId: { type: "string" },
              reason: { type: "string" }
            },
            required: ["selectedDishId", "reason"]
          }
        }
      });

      if (!response.text) {
        throw new Error('AIからの応答が空でした。');
      }

      const aiResult = JSON.parse(response.text.trim());
      // 万が一数値型で返ってきても強制的に文字列に変換
      selectedDishId = String(aiResult.selectedDishId);
      aiReason = aiResult.reason;

    // --- Bパターン：特定のキーワードがある場合（DBから検索） ---
    } else {
      // 1週間以内に表示されていない候補から絞り込みを行う
      const matchedDishes = availableDishes.filter(dish =>
        dish.tags.some(tag => tag.name.includes(cleanKeyword) || cleanKeyword.includes(tag.name))
      );

      // マッチするものがなければ、1週間以内の重複を除外した候補全体からランダム抽出
      const targetList = matchedDishes.length > 0 ? matchedDishes : availableDishes;
      const randomIndex = Math.floor(Math.random() * targetList.length);
      
      selectedDishId = String(targetList[randomIndex].id);
      aiReason = matchedDishes.length > 0 
        ? `「${cleanKeyword}」に合うメニューから選びました！` 
        : `「${cleanKeyword}」に合うメニューが見つからなかったので、すべてのメニューから選びました！`;
    }

    // 4. 選択されたメニューの存在チェック
    // 全体リスト（userDishes）からマッチするごはんを特定する
    const finalDish = userDishes.find(d => String(d.id) === selectedDishId);
    if (!finalDish) {
      // AIがメニューにない架空のIDを返した場合のセーフティガード
      const fallbackDish = userDishes[0];
      selectedDishId = String(fallbackDish.id);
      return NextResponse.json({
        dish: { id: fallbackDish.id, name: fallbackDish.name, imageUrl: fallbackDish.imageUrl },
        reason: "AIの提案がリスト外だったため、メニューから自動選出しました！",
        isAiGeneration: true
      });
    }

    // 5. 履歴テーブル（DishShowLog）に結果を保存
    try {
      await prisma.dishShowLog.create({
        data: {
          userId: userWithDishes.id,
          dishId: finalDish.id,
          keyword: cleanKeyword || 'なんでもいい',
        }
      });
    } catch (logError) {
      // ログ保存の成否でメイン処理を止めないための安全策
      console.error('Failed to save log:', logError);
    }

    // 6. フロントに結果を返却
    return NextResponse.json({
      dish: {
        id: finalDish.id,
        name: finalDish.name,
        imageUrl: finalDish.imageUrl,
      },
      reason: aiReason,
      isAiGeneration: cleanKeyword === 'なんでもいい' || cleanKeyword === ''
    });

  } catch (error) {
    console.error('API Error detailed:', error);
    return NextResponse.json({ error: 'サーバー内でエラーが発生しました。' }, { status: 500 });
  }
}