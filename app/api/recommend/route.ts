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
      update: { email: user.email || "" },
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

    if (userDishes.length === 0) {
      return new Response(
        JSON.stringify({ error: "登録されているメニューがありません。先にメニューを追加してください。" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const availableDishes = userDishes.filter(
      (dish) => !excludedDishIds.includes(dish.id)
    );

    let targetDishes: typeof userDishes = [];

    if (cleanKeyword === "なんでもいい") {
      targetDishes = availableDishes.length > 0 ? availableDishes : userDishes;
    } else {
      const searchKeywords = cleanKeyword
        .replace(/[,，、]/g, " ")
        .split(/\s+/)
        .filter((k: string) => k.length > 0);

      const matchedAvailable = availableDishes.filter((dish) =>
        searchKeywords.every(
          (kw: string) =>
            dish.name.includes(kw) ||
            dish.tags.some((t) => t.name.includes(kw))
        )
      );

      if (matchedAvailable.length > 0) {
        targetDishes = matchedAvailable;
      } else {
        const matchedAll = userDishes.filter((dish) =>
          searchKeywords.every(
            (kw: string) =>
              dish.name.includes(kw) ||
              dish.tags.some((t) => t.name.includes(kw))
          )
        );

        if (matchedAll.length > 0) {
          targetDishes = matchedAll;
        } else {
          return new Response(
            JSON.stringify({ error: `「${cleanKeyword}」に一致する登録メニューが見つかりませんでした。` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    const selectedDish = targetDishes[Math.floor(Math.random() * targetDishes.length)];

    const prompt = `あなたは献立提案アシスタントです。
ユーザーの要望: 「${cleanKeyword}」
選ばれた料理: 「${selectedDish.name}」

この料理がユーザーの要望や今の気分にどのように合っているか、親しみやすく50文字程度で「おすすめの理由」を作成してください。`;

    let reasonText = `「${cleanKeyword}」にぴったりなメニューです！`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reason: { type: "STRING", description: "選んだ理由" },
            },
            required: ["reason"],
          },
        },
      });

      let rawText = response.text || "{}";
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(rawText);
      if (parsed.reason) {
        reasonText = parsed.reason;
      }
    } catch (aiError) {
      console.warn("Gemini APIの理由生成でエラーが発生しましたが継続します:", aiError);
    }

    await prisma.dishShowLog.create({
      data: {
        userId: userId,
        dishId: selectedDish.id,
        keyword: cleanKeyword,
      },
    });

    return new Response(
      JSON.stringify({
        dish: {
          id: selectedDish.id,
          name: selectedDish.name,
          imageUrl: selectedDish.imageUrl || null,
        },
        reason: reasonText,
        isAiGeneration: false,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

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