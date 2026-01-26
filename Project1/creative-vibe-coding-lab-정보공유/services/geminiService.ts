import { GoogleGenAI, Type } from "@google/genai";
import { LinkItem, ParsedMessage } from "../types";
import { extractUrls } from "./chatParser";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple hash function for browser environment
function generateStableId(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(12, '0');
}

// Define interface for AI response items
interface AIProcessedItem {
  id: string;
  url: string;
  title: string;
  category: string;
  summary: string;
}

export const processMessagesWithGemini = async (messages: ParsedMessage[]): Promise<LinkItem[]> => {
  // Flatten messages: If a message has 3 links, create 3 separate items to process.
  const rawItems: any[] = [];

  messages.forEach((msg, msgIndex) => {
    const urls = extractUrls(msg.content);
    // Filter duplicates within a single message to avoid redundant cards for the same link in one text block
    const uniqueUrls = Array.from(new Set(urls));

    uniqueUrls.forEach((url, urlIndex) => {
      // Create a deterministic ID based on content (Date + Time + Sender + URL)
      // This ensures that even if the file order changes or lines are added, the ID remains the same.
      const idString = `${msg.date}|${msg.time}|${msg.sender}|${url}`;
      const stableId = generateStableId(idString);

      rawItems.push({
        id: stableId,
        targetUrl: url,
        fullMessage: msg.content, // Keep original context
        sender: msg.sender,
        date: msg.date,
      });
    });
  });

  if (rawItems.length === 0) {
    return [];
  }

  // Construct a prompt to ask Gemini to categorize and summarize each specific link item
  const prompt = `
    Analyze the following list of links extracted from chat messages.
    
    For each item:
    1. Focus on the 'targetUrl' as the primary content source.
    2. Use 'fullMessage' to understand the context of why it was shared.
    3. Title: Create a concise, descriptive title in KOREAN for the 'targetUrl' content.
    4. Category: Choose one of ["개인 프로젝트", "AI 뉴스", "개발 툴", "튜토리얼", "디자인", "일반", "커리어", "기타"] in KOREAN.
       * CRITICAL: If the message context implies the sender created the content (e.g., "I made this", "my toy project", "제 포트폴리오입니다", "만들어봤습니다", "결과물 공유"), you MUST categorize it as "개인 프로젝트".
    5. Summary: Write a 1-sentence summary in KOREAN explaining the link.
    
    Input Data:
    ${JSON.stringify(rawItems.slice(0, 30))} 
    (Limited to first 30 links for this demo)
  `;

  // Define schema for structured output
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        url: { type: Type.STRING },
        title: { type: Type.STRING },
        category: { type: Type.STRING },
        summary: { type: Type.STRING },
      },
      required: ["id", "url", "title", "category", "summary"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const processedData: AIProcessedItem[] = JSON.parse(response.text || "[]");

    // Merge AI results back with original data to keep context like date/sender
    const finalItems: LinkItem[] = [];

    // Create a map for quick lookup
    const aiResultMap = new Map<string, AIProcessedItem>();
    
    if (Array.isArray(processedData)) {
      processedData.forEach(item => {
        aiResultMap.set(item.id, item);
      });
    }

    // Iterate through the flattened rawItems (not the original messages)
    // We only process the ones we sent (slice 0, 30), effectively.
    const itemsToProcess = rawItems.slice(0, 30);

    itemsToProcess.forEach(raw => {
      const aiInfo = aiResultMap.get(raw.id);
      if (aiInfo) {
        finalItems.push({
          id: raw.id,
          url: aiInfo.url || raw.targetUrl,
          sender: raw.sender,
          date: raw.date,
          originalText: raw.fullMessage,
          category: aiInfo.category,
          summary: aiInfo.summary,
          title: aiInfo.title,
          timestamp: Date.now(),
          comments: []
        });
      } else {
        // Fallback if AI missed it
        finalItems.push({
          id: raw.id,
          url: raw.targetUrl,
          sender: raw.sender,
          date: raw.date,
          originalText: raw.fullMessage,
          category: "기타",
          summary: "AI 요약 정보 없음",
          title: "링크 공유",
          timestamp: Date.now(),
          comments: []
        });
      }
    });

    return finalItems;

  } catch (error) {
    console.error("Gemini processing error:", error);
    // Fallback: return raw items without AI enrichment
    return rawItems.slice(0, 30).map(raw => ({
      id: raw.id,
      url: raw.targetUrl,
      sender: raw.sender,
      date: raw.date,
      originalText: raw.fullMessage,
      category: "미분류",
      summary: raw.fullMessage.substring(0, 100),
      title: "링크 아이템",
      timestamp: Date.now(),
      comments: []
    }));
  }
};