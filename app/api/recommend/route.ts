import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, keyword } = body;

    console.log("【デバッグ】受信した userId:", userId);
    console.log("【デバッグ】受信した keyword:", keyword);

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です。" },
        { status: 400 }
      );
    }

    const cleanKeyword = keyword?.trim() || "なんでもいい";
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentLogs = await prisma.dishShowLog.findMany({
      where: {
        userId: userId,
        createdAt: { gte: oneWeekAgo },
      },
      select: { dishId: true },
      orderBy: { createdAt: "desc" },
    });

    const excludedDishIds = recentLogs.map((log) => log.dishId);
    const userDishes = await prisma.dish.findMany({
      where: { userId: userId },
      include: { tags: true },
    });

    let availableDishes = userDishes.filter(
      (dish) => !excludedDishIds.includes(dish.id)
    );

    if (availableDishes.length === 0 && userDishes.length > 0) {
      console.log("【デバッグ】全メニューが一巡したため、履歴をリセットして再選定します。");
      availableDishes = userDishes;
    }

    // -------------------------------------------------------------
    // パターンA: 登録されているメニューがある場合（AIがその中から選ぶ）
    // -------------------------------------------------------------
    if (availableDishes.length > 0) {
      const shuffledDishes = [...availableDishes].sort(() => Math.random() - 0.5);
      const menuListText = shuffledDishes
        .map((dish) => {
          const tagNames = dish.tags.map((t) => t.name).join(", ");
          return `- ID: ${dish.id} | 料理名: ${dish.name} | タグ: ${tagNames || "なし"}`;
        })
        .join("\n");

      const prompt = `あなたは献立提案アシスタントです。
以下の【候補メニューリスト】の中から、ユーザーの要望「${cleanKeyword}」にぴったりな料理を【必ず1つだけ】選んでください。

【重要ルール】
- ユーザーの要望が「なんでもいい」の場合は、候補リストの中からバリエーション豊かにランダム感をもって選んでください。
- 必ずリスト内に存在する料理の ID と 料理名 を選んでください。
- 理由（reason）は、なぜその料理をおすすめしたのかを50文字程度で親しみやすく書いてください。

【候補メニューリスト】
${menuListText}`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            temperature: 0.9,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                selectedId: { type: "STRING", description: "選んだ料理のID" },
                name: { type: "STRING", description: "選んだ料理名" },
                reason: { type: "STRING", description: "選んだ理由" },
              },
              required: ["selectedId", "name", "reason"],
            },
          },
        });

        const parsed = JSON.parse(response.text || "{}");

        const matchedDish =
          availableDishes.find((d) => d.id === parsed.selectedId) || shuffledDishes[0];

        await prisma.dishShowLog.create({
          data: {
            userId: userId,
            dishId: matchedDish.id,
            keyword: cleanKeyword,
          },
        });

        return NextResponse.json({
          dish: {
            id: matchedDish.id,
            name: matchedDish.name,
            imageUrl: matchedDish.imageUrl || null,
          },
          reason: parsed.reason || `本日のおすすめメニューです！`,
          isAiGeneration: false,
        });

      } catch (aiError) {
        console.warn("Gemini Error (登録メニュー選定時):", aiError);

        const fallbackDish = shuffledDishes[Math.floor(Math.random() * shuffledDishes.length)];

        await prisma.dishShowLog.create({
          data: {
            userId: userId,
            dishId: fallbackDish.id,
            keyword: cleanKeyword,
          },
        });

        return NextResponse.json({
          dish: {
            id: fallbackDish.id,
            name: fallbackDish.name,
            imageUrl: fallbackDish.imageUrl || null,
          },
          reason: `本日のおすすめメニューです！`,
          isAiGeneration: false,
        });
      }
    }

    // -------------------------------------------------------------
    // パターンB: 登録メニューが1件もない場合（AIが自由に新規作成する）
    // -------------------------------------------------------------
    const freePrompt = `ユーザーの希望キーワードは「${cleanKeyword}」です。今日のごはんのおすすめメニューを1つ提案してください。毎回違うジャンルの料理を提案してください。`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: freePrompt,
      config: {
        temperature: 1.0, // 多様性を最大化
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "料理名" },
            reason: {
              type: "STRING",
              description: "おすすめの理由（50文字程度で親しみやすく）",
            },
          },
          required: ["name", "reason"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    return NextResponse.json({
      dish: {
        id: `ai-${Date.now()}`,
        name: parsed.name || "特製ハンバーグ",
        imageUrl: null,
      },
      reason: parsed.reason || "今日にぴったりの特別メニューです！",
      isAiGeneration: true,
    });

  } catch (error) {
    console.error("Recommend API Error:", error);
    return NextResponse.json(
      { error: "メニューの決定に失敗しました。" },
      { status: 500 }
    );
  }
}