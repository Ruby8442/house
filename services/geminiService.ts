
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Property } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getPropertyAdvice = async (property: Property) => {
  const publicRatio = (((property.deed - property.indoor - property.balcony) / property.deed) * 100).toFixed(1);
  const indoorUnitPrice = (property.price / property.indoor).toFixed(1);

  const prompt = `
    請以專業房地產專家的角度，評價以下建案：
    名稱：${property.name}
    區域：${property.area}
    格局：${property.type}
    總價：${property.price} 萬
    總戶數：${property.households}
    樓層：${property.floor}
    權狀：${property.deed} 坪
    室內：${property.indoor} 坪
    陽台：${property.balcony} 坪
    車位：${property.car}
    機車位：${property.bike}
    
    計算出的公設比：${publicRatio}%
    室內每坪單價：${indoorUnitPrice} 萬

    請結合 Google 搜尋到的 ${property.area} 區域最新實價登錄行情，提供 3-5 個優缺點分析，並給予一個 1-10 分的推薦指數。
    請用繁體中文回答，並使用 Markdown 格式。
    最後請列出參考來源。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Upgraded to Pro for search grounding
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    let text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      text += "\n\n### 參考來源\n" + chunks.map((c: any) => `- [${c.web?.title || '連結'}](${c.web?.uri})`).join('\n');
    }
    
    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "抱歉，目前無法取得 AI 建議。請稍後再試。";
  }
};

export const compareProperties = async (properties: Property[]) => {
  if (properties.length < 2) return "請至少新增兩個建案以進行比較。";

  const data = properties.map(p => {
    const pub = (((p.deed - p.indoor - p.balcony) / p.deed) * 100).toFixed(1);
    const unit = (p.price / p.indoor).toFixed(1);
    return `${p.name} (${p.area}): 總價${p.price}萬, 室內${p.indoor}坪, 每坪${unit}萬, 公設比${pub}%`;
  }).join('\n');

  const prompt = `
    請比較以下幾個建案的優劣，並給出您的首選建議：
    ${data}

    請從 CP 值、公設合理性、以及居住舒適度三個面向進行深度比較。
    請用繁體中文回答，並使用 Markdown 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "抱歉，目前無法取得 AI 比較報告。";
  }
};

export const extractPropertyFromImage = async (base64Data: string) => {
  const prompt = "這是一張房屋建案的宣傳單或格局圖。請從中提取相關資訊，並以 JSON 格式回傳。如果某個欄位找不到，請回傳空字串或 0。總價請換算為『萬』為單位。坪數請提取數字。";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "建案名稱" },
            area: { type: Type.STRING, description: "建案區域" },
            type: { type: Type.STRING, description: "格局房型" },
            price: { type: Type.NUMBER, description: "總價(萬)" },
            households: { type: Type.NUMBER, description: "總戶數" },
            floor: { type: Type.STRING, description: "樓層資訊" },
            deed: { type: Type.NUMBER, description: "權狀坪數" },
            indoor: { type: Type.NUMBER, description: "室內坪數" },
            balcony: { type: Type.NUMBER, description: "陽台坪數" },
            car: { type: Type.STRING, enum: ["無", "平面", "機械"], description: "車位類型" },
            bike: { type: Type.STRING, enum: ["無", "戶外", "室內"], description: "機車位類型" },
          },
          required: ["name"],
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (error) {
    console.error("Extraction error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  // Clean up markdown for TTS
  const cleanText = text.replace(/[#*`]/g, '').slice(0, 1000); 
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `用親切專業的管家語氣唸出以下房地產分析報告：${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Use Kore for a balanced professional voice
          },
        },
      },
    });
    
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS error:", error);
    return undefined;
  }
};
