import { GoogleGenAI, Schema, Type } from "@google/genai";

// Initialize Gemini on the server side where API_KEY is safe
// Vercel/Netlify will inject process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
你是一个专业的营养师助手。
用户有严格的每日饮食目标：总热量 1350kcal，碳水 >50%，蛋白质 <80g。

关键要求：
1. **熟重 (Cooked Weight)**：所有推荐的食物重量必须是熟重。
2. **精确拆分**：将餐食分解为具体的配料（如：米饭、牛肉、青菜），并为**每一项**配料提供精确的营养数据。
3. **油脂/烹饪分析**：必须根据烹饪方式（如：炒、炸、红烧）或食材特性（如：五花肉），估算**额外摄入的油脂**。
   - 在 cookingNote 字段中明确提示（例如："爆炒使用了约10g油" 或 "牛腩自带油脂较高"）。
   - 确保 macros.fat 中包含了这部分油脂的热量。
4. **中文回复**。
`;

// Shared Schemas
const macrosSchema = {
  type: Type.OBJECT,
  properties: {
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    fat: { type: Type.NUMBER },
  },
  required: ["calories", "protein", "carbs", "fat"],
};

const ingredientSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "食材名称 (例如: 熟米饭)" },
    grams: { type: Type.NUMBER, description: "精确的熟重 (克)" },
    macros: macrosSchema,
    cookingNote: { type: Type.STRING, description: "油脂/烹饪提示 (例如: '含烹饪油约8g')"}
  },
  required: ["name", "grams", "macros"],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    selectedOption: { type: Type.STRING, description: "选择的餐食名称" },
    reason: { type: Type.STRING, description: "推荐理由" },
    ingredients: {
      type: Type.ARRAY,
      items: ingredientSchema,
    },
    estimatedMacros: macrosSchema,
  },
  required: ["selectedOption", "reason", "ingredients", "estimatedMacros"],
};

const manualSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        weight: { type: Type.NUMBER, description: "grams (cooked)" },
        macros: macrosSchema,
        cookingNote: { type: Type.STRING, description: "油脂/烹饪提示"}
      },
      required: ["name", "weight", "macros"]
    }
  };

export default async function handler(request, response) {
  // Handle CORS if necessary (usually handled by platform, but good for local dev proxies)
  if (request.method === 'OPTIONS') {
    return response.status(200).send('ok');
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, payload } = request.body;
    const model = "gemini-2.5-flash";

    let resultText = "";

    if (action === 'recommendation') {
      // --- Handle Meal Recommendation ---
      const { request: reqData, currentIntake } = payload;
      
      const remainingStr = `
        当前已摄入: 热量 ${currentIntake.calories}, 蛋白质 ${currentIntake.protein}g, 碳水 ${currentIntake.carbs}g, 脂肪 ${currentIntake.fat}g
        剩余配额: 热量 ${reqData.remainingMacros.calories}, 蛋白质 ${reqData.remainingMacros.protein}g, 碳水 ${reqData.remainingMacros.carbs}g
      `;

      let prompt = "";
      if (reqData.type === 'DECISION' && reqData.userOptions) {
        prompt = `
          用户在纠结：${JSON.stringify(reqData.userOptions)}。
          ${remainingStr}
          请选择最合适的一项。
          务必计算主要成分的**精确熟重**和**单独的营养数据**。
          **必须分析油脂**：对于炒菜或油腻的肉类，请在 ingredients 的 cookingNote 字段中特别注明估算的油脂量。
          特别注意：蛋白质全天硬性上限 80g。如果剩余蛋白质很少，请减少肉量。
        `;
      } else {
        prompt = `
          用户需要一个${reqData.targetMealName}的推荐。
          ${remainingStr}
          请推荐一顿简单、健康且美味的餐食。
          计算精确的份量（熟重）和**每一项食材的营养数据**。
          **必须分析油脂**：请在 ingredients 的 cookingNote 字段中特别注明因烹饪方式产生的油脂量。
        `;
      }

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.7,
        },
      });
      resultText = result.text;

    } else if (action === 'manualEntry') {
      // --- Handle Manual Entry Analysis ---
      const { text, imageBase64 } = payload;
      
      let promptText = `
        用户提供了一次饮食记录。
        ${imageBase64 ? "请根据图片内容（视觉估算份量）以及用户的文字补充描述（例如'只吃了一半'）来分析。" : "请根据文字描述来分析。"}
        文字描述: "${text}"。

        请将其拆解为具体的食材列表（熟重）。
        并估算每一项的宏量营养素。
        **重要**：如果用户描述了烹饪方式（如炒、炸、煎）或食物本身含油（如肥牛），或者图片中看起来油光发亮，
        请务必在 cookingNote 字段中写明估算的油脂/油量（例如："爆炒估算用油10g"），并将这部分热量计入 fat 和 calories。
      `;

      const parts = [];
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64
          }
        });
      }
      parts.push({ text: promptText });

      const result = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: manualSchema,
        },
      });
      resultText = result.text;

    } else if (action === 'summary') {
      // --- Handle Daily Summary ---
      const { dayLog } = payload;
      const prompt = `
        用户今天摄入:
        热量: ${dayLog.calories} (目标: 1350)
        蛋白质: ${dayLog.protein}g (上限 80g)
        碳水: ${dayLog.carbs}g (目标: >50%)
        脂肪: ${dayLog.fat}g

        请给出一个简短的中文总结（2-3句话）。评价是否达标。
      `;
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      resultText = JSON.stringify({ text: result.text }); // Wrap plain text in JSON

    } else if (action === 'report') {
       // --- Handle Weekly Report ---
       const { records } = payload;
       // We reconstruct the summary data string here to keep payload small
       const summaryData = records.map(r => {
        const totalMacros = r.meals.reduce((acc, m) => {
            m.foods.forEach(f => {
                acc.c += f.macros.calories;
                acc.p += f.macros.protein;
                acc.carbs += f.macros.carbs;
                acc.f += f.macros.fat;
            });
            return acc;
        }, { c: 0, p: 0, carbs: 0, f: 0 });
    
        return `
          日期: ${r.date}
          摄入: 热量${Math.round(totalMacros.c)}, 蛋${Math.round(totalMacros.p)}, 碳${Math.round(totalMacros.carbs)}, 脂${Math.round(totalMacros.f)}
          身体: 体重${r.metrics.weight || '-'}kg, 腰围${r.metrics.waist || '-'}cm, 大腿${r.metrics.thigh || '-'}cm, 小腿${r.metrics.calf || '-'}cm
        `;
      }).join('\n');
    
      const prompt = `
        请根据以下用户过去一周的饮食和身体维度数据生成一份周报。
        
        用户目标：热量1350，碳水>50%，蛋白质<80g。
        
        数据列表：
        ${summaryData}
    
        任务：
        1. **饮食分析**：评价是否遵守了热量和营养素限制。
        2. **身体变化**：分析体重和围度的变化趋势（如果数据存在）。
        3. **关联分析**：尝试寻找饮食与身体变化之间的联系（例如：哪天吃多了导致第二天体重波动）。
        4. **下周建议**：给出简短的可行建议。
        
        请用中文回复，格式清晰，语气专业且鼓励。不要使用 Markdown 标题（#），使用加粗（**）即可。
      `;

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      resultText = JSON.stringify({ text: result.text });
    }

    return response.status(200).json(JSON.parse(resultText));

  } catch (error) {
    console.error("Backend Proxy Error:", error);
    return response.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}