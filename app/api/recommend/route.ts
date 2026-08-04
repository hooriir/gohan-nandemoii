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

    let availableDishes = userDishes.filter(
      (dish) => !excludedDishIds.includes(dish.id)
    );

    if (availableDishes.length === 0 && userDishes.length > 0) {
      availableDishes = userDishes;
    }

    // ==========================================
    // Pattern A: ユーザー登録メニューが存在する場合
    // ==========================================
    if (availableDishes.length > 0) {
      let targetDishes = availableDishes;
      if (cleanKeyword !== "なんでもいい") {
        const searchKeywords = cleanKeyword
          .replace(/[,，、]/g, " ")
          .split(/\s+/)
          .filter((k: string) => k.length > 0);

        const matched = availableDishes.filter((dish) =>
          searchKeywords.every(
            (kw: string) =>
              dish.name.includes(kw) ||
              dish.tags.some((t) => t.name.includes(kw))
          )
        );

        if (matched.length > 0) {
          targetDishes = matched;
        } else {
          targetDishes = availableDishes;
        }
      }

      const selectedDish = targetDishes[Math.floor(Math.random() * targetDishes.length)];

      const prompt = `あなたは献立提案アシスタントです。
ユーザーの要望: 「${cleanKeyword}」
選ばれた料理: 「${selectedDish.name}」

この料理がユーザーの要望や今の気分にどのように合っているか、親しみやすく50文字程度で「おすすめの理由」を作成してください。`;

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
        const reasonText = parsed.reason || `「${cleanKeyword}」にぴったりなメニューです！`;

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

      } catch (aiError) {
        console.warn("Gemini APIエラーのためフォールバックします:", aiError);

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
            reason: `「${cleanKeyword}」にぴったりなメニューです！`,
            isAiGeneration: false,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ==========================================
    // Pattern B: メニュー0件時の自由提案
    // ==========================================
    const freePrompt = `ユーザーの希望キーワードは「${cleanKeyword}」です。今日のごはんのおすすめメニューを1つ提案してください。「${cleanKeyword}」に合ったジャンルや味付けの料理を選んでください。`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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

      let rawText = response.text || "{}";
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(rawText);

      return new Response(
        JSON.stringify({
          dish: {
            name: parsed.name || "きつねうどん",
          },
          reason:
            parsed.reason ||
            `「${cleanKeyword}」に合わせて作ってみるのはいかがでしょうか？`,
          isAiGeneration: true,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (patternBError) {
      console.error("Pattern B AI生成エラー:", patternBError);

      return new Response(
        JSON.stringify({
          dish: {
            name: "カレーライス",
          },
          reason: `「${cleanKeyword}」な気分の時は定番のカレーがおすすめです！`,
          isAiGeneration: true,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
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