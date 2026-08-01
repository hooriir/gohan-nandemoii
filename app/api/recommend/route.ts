import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "認証が必要です。ログインしてください。" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    const body = await request.json();
    const { keyword } = body;

    const cleanKeyword = keyword?.trim() || "なんでもいい";
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const displayName =
      user.user_metadata?.name || user.email?.split("@")[0] || "ユーザー";
    await prisma.user.upsert({
      where: { id: userId },
      update: { email: user.email },
      create: {
        id: userId,
        email: user.email || "",
        name: displayName,
        password: "AUTH_USER",
      },
    });

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

    if (availableDishes.length > 0) {
      const shuffledDishes = [...availableDishes].sort(
        () => Math.random() - 0.5
      );
      const menuListText = shuffledDishes
        .map((dish) => {
          const tagNames = dish.tags.map((t) => t.name).join(", ");
          return `- ID: ${dish.id} | 料理名: ${dish.name} | タグ・キーワード: ${tagNames || "なし"}`;
        })
        .join("\n");

      const prompt = `あなたは献立提案アシスタントです。
ユーザーの要望: 「${cleanKeyword}」

以下の【候補メニューリスト】の中から、ユーザーの要望に合致する料理を【必ず1つだけ】選んでください。

【選択における必須優先ルール】
1. ユーザーの要望が「なんでもいい」以外の場合：
   - 料理名や【タグ・キーワード】の中に、ユーザーの要望「${cleanKeyword}」と関連する単語・意味が含まれている料理を【最優先】で選んでください。
   - 完璧に一致するものがなければ、できる限り雰囲気が近い料理を選んでください。
2. ユーザーの要望が「なんでもいい」の場合：
   - 候補リストの中からバリエーション豊かにランダム感をもって選んでください。
3. 必ずリスト内に存在する料理の ID と 料理名 を選んでください。
4. 理由（reason）は、ユーザーの要望（${cleanKeyword}）にどう応えたかを含めて、50文字程度で親しみやすく書いてください。

【候補メニューリスト】
${menuListText}`;

      try {
        const responseStream = await ai.models.generateContentStream({
          model: "models/gemini-1.5-flash",
          contents: prompt,
          config: {
            temperature: 0.7, // 厳密性を高めるため少し下げる (0.9 -> 0.7)
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
                  availableDishes.find((d) => d.id === parsed.selectedId) ||
                  shuffledDishes[0];

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
        console.warn(
          "Gemini APIエラー（クォータ制限等）のためフォールバック選定を行います:",
          aiError
        );

        // フォールバック時もキーワードマッチを優先
        const matchedDishes = shuffledDishes.filter(
          (d) =>
            d.name.includes(cleanKeyword) ||
            d.tags.some((t) => t.name.includes(cleanKeyword))
        );
        const fallbackDish =
          matchedDishes.length > 0
            ? matchedDishes[Math.floor(Math.random() * matchedDishes.length)]
            : shuffledDishes[Math.floor(Math.random() * shuffledDishes.length)];

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
            reason: `「${cleanKeyword}」にぴったりなメニューです！`,
            isAiGeneration: false,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const freePrompt = `ユーザーの希望キーワードは「${cleanKeyword}」です。今日のごはんのおすすめメニューを1つ提案してください。「${cleanKeyword}」に合ったジャンルや味付けの料理を選んでください。`;

    const responseStream = await ai.models.generateContentStream({
      model: "models/gemini-1.5-flash",
      contents: freePrompt,
      config: {
        temperature: 0.8,
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
    return new Response(
      JSON.stringify({ error: "メニューの決定に失敗しました。" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}