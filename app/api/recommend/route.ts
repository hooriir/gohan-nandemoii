import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, keyword } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "ユーザーIDが必要です。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
      availableDishes = userDishes;
    }

    // -------------------------------------------------------------
    // パターンA: 登録されているメニューがある場合
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
        const responseStream = await ai.models.generateContentStream({
          model: "models/gemini-1.5-flash", // 正しいモデル名表記
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

        let fullText = "";

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            try {
              for await (const chunk of responseStream) {
                if (chunk.text) {
                  fullText += chunk.text;
                  controller.enqueue(encoder.encode(chunk.text));
                }
              }

              try {
                const parsed = JSON.parse(fullText || "{}");
                const matchedDish =
                  availableDishes.find((d) => d.id === parsed.selectedId) || shuffledDishes[0];

                await prisma.dishShowLog.create({
                  data: {
                    userId: userId,
                    dishId: matchedDish.id,
                    keyword: cleanKeyword,
                  },
                });
              } catch (dbError) {
                console.error("DB保存またはパース失敗:", dbError);
              }

              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });

      } catch (aiError) {
        console.warn("Gemini APIエラー（クォータ制限等）のためフォールバック選定を行います:", aiError);

        // AI呼び出しに失敗した場合は、フォールバックとしてランダム選定
        const fallbackDish = shuffledDishes[Math.floor(Math.random() * shuffledDishes.length)];

        await prisma.dishShowLog.create({
          data: {
            userId: userId,
            dishId: fallbackDish.id,
            keyword: cleanKeyword,
          },
        });

        return new Response(
          JSON.stringify({
            dish: {
              id: fallbackDish.id,
              name: fallbackDish.name,
              imageUrl: fallbackDish.imageUrl || null,
            },
            reason: `本日のおすすめメニューです！`,
            isAiGeneration: false,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // -------------------------------------------------------------
    // パターンB: 登録メニューが1件もない場合
    // -------------------------------------------------------------
    const freePrompt = `ユーザーの希望キーワードは「${cleanKeyword}」です。今日のごはんのおすすめメニューを1つ提案してください。毎回違うジャンルの料理を提案してください。`;

    const responseStream = await ai.models.generateContentStream({
      model: "models/gemini-1.5-flash", // 正しいモデル名表記
      contents: freePrompt,
      config: {
        temperature: 1.0,
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

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (error) {
    console.error("Recommend API Error:", error);
    return new Response(JSON.stringify({ error: "メニューの決定に失敗しました。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}