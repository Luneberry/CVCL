import { GoogleGenAI, Type } from "@google/genai";
import { LinkItem, ParsedMessage } from "../types";
import { extractUrls } from "./chatParser";

const getApiKey = () => {
  // 1. Try Vite environment variable (Browser)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // 2. Try Node.js environment variables (Script)
  return process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || '';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

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

// New helper function to create a sortable timestamp from KakaoTalk date/time
function parseKoreanDateTime(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return Date.now();

  const dateMatch = dateStr.match(/(\d{4})년 (\d{1,2})월 (\d{1,2})일/);
  const timeMatch = timeStr.match(/(오전|오후) (\d{1,2}):(\d{1,2})/);

  if (!dateMatch || !timeMatch) {
    try {
      // Fallback for different date formats if possible
      return new Date(`${dateStr} ${timeStr}`).getTime();
    } catch (e) {
      return Date.now();
    }
  }

  const [, year, month, day] = dateMatch.map(Number);
  const [, period, hourStr, minuteStr] = timeMatch;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (period === '오후' && hour !== 12) {
    hour += 12;
  }
  if (period === '오전' && hour === 12) {
    hour = 0; // Midnight case: 12 AM is 00 hours
  }

  // JS month is 0-indexed
  return new Date(year, month - 1, day, hour, minute).getTime();
}

// Define interface for AI response items
interface AIProcessedItem {
  id: string;
  url: string;
  title: string;
  category: string;
  summary: string;
}

// Helper function to process a single batch
async function processBatch(items: any[]): Promise<AIProcessedItem[]> {
  const prompt = `
    Analyze the following list of links extracted from chat messages.
    
    For each item:
    1. Focus on the 'targetUrl' as the primary content source.
    2. Use 'fullMessage' to understand the context of why it was shared.
    3. Title: Create a concise, descriptive title in KOREAN for the 'targetUrl' content.
    4. Category: Choose one of ["스터디", "AI 뉴스", "개발 툴", "튜토리얼", "디자인", "일반", "커리어", "기타"] in KOREAN.
       * If the message is about recruiting for a study group, sharing study materials, or related to a study session (e.g., "스터디", "함께 공부", "모집"), categorize it as "스터디".
       * If the 'targetUrl' is for a Google Spreadsheet ('docs.google.com/spreadsheets') or Google Presentation ('docs.google.com/presentation'), you MUST categorize it as "스터디".
    5. Summary: Write a 1-sentence summary in KOREAN explaining the link.
    
    Input Data:
    ${JSON.stringify(items)} 
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
    console.log(`[Batch] Calling Gemini API (Model: gemini-2.0-flash) | Key Prefix: ${process.env.API_KEY?.substring(0, 5)}...`);
    
    // Retry logic for 429 errors
    let attempt = 0;
    const maxAttempts = 3;
    const baseDelay = 2000; // 2 seconds

    while (attempt < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          },
        });

        const parsed = JSON.parse(response.text || "[]");
        return Array.isArray(parsed) ? parsed : [];
      } catch (error: any) {
        attempt++;
        if (error?.status === 429 || error?.message?.includes('429')) {
          if (attempt < maxAttempts) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`[Batch] Rate limit hit (429). Retrying in ${delay/1000}s... (Attempt ${attempt}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error; // Re-throw if not 429 or max attempts reached
      }
    }
    return [];
  } catch (error) {
    console.error("Batch processing error:", error);
    return [];
  }
}

export const processMessagesWithGemini = async (messages: ParsedMessage[], excludedUrls: string[] = []): Promise<LinkItem[]> => {
  // Flatten messages: If a message has 3 links, create 3 separate items to process.
  const rawItems: any[] = [];

  messages.forEach((msg) => {
    const urls = extractUrls(msg.content);
    // Filter duplicates within a single message
    const uniqueUrls = Array.from(new Set(urls));

    uniqueUrls.forEach((url) => {
      // Skip if URL is in the excluded list (e.g., already registered as a personal project)
      if (excludedUrls.some(ex => url.includes(ex) || ex.includes(url))) {
        return;
      }

      // Create a deterministic ID
      const idString = `${msg.date}|${msg.time}|${msg.sender}|${url}`;
      const stableId = generateStableId(idString);

      rawItems.push({
        id: stableId,
        targetUrl: url,
        fullMessage: msg.content, // Keep original context
        sender: msg.sender,
        date: msg.date,
        time: msg.time, // Pass time for accurate timestamp generation
      });
    });
  });

  if (rawItems.length === 0) {
    return [];
  }

  console.log(`Total links found: ${rawItems.length}. Processing in batches...`);

  // Process in batches to avoid token limits and ensure reliability
  const BATCH_SIZE = 30;
  const processedData: AIProcessedItem[] = [];

  for (let i = 0; i < rawItems.length; i += BATCH_SIZE) {
    const batch = rawItems.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(rawItems.length / BATCH_SIZE)}...`);
    
    // Process batch and wait
    const batchResults = await processBatch(batch);
    processedData.push(...batchResults);
    
    // Optional: Small delay to be nice to the API rate limits
    if (i + BATCH_SIZE < rawItems.length) {
      console.log("Processing next batch (5s delay)...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Merge AI results back with original data
  const finalItems: LinkItem[] = [];
  const aiResultMap = new Map<string, AIProcessedItem>();
  
  processedData.forEach(item => {
    aiResultMap.set(item.id, item);
  });

  // Iterate through ALL rawItems to create the final list
  rawItems.forEach(raw => {
    const aiInfo = aiResultMap.get(raw.id);
    const timestamp = parseKoreanDateTime(raw.date, raw.time);

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
        timestamp: timestamp,
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
        summary: "AI 처리 실패", // Updated fallback message
        title: "링크 공유",
        timestamp: timestamp,
        comments: []
      });
    }
  });

  return finalItems;
};

export const generateJournalFromRawText = async (rawText: string): Promise<{ title: string; content: string }> => {
  const prompt = `
    다음 텍스트는 개발팀의 스터디나 회의록입니다.
    이 내용을 바탕으로 개발일지를 작성해주세요.

    요구사항:
    1.  **제목 (title)**: 전체 내용을 대표하는 핵심적인 제목을 10~20자 내외의 한국어로 생성해주세요.
    2.  **내용 (content)**:
        *   전체 내용을 **아주 상세하고 구체적으로** 요약해주세요.
        *   주요 논의사항, 결정사항, 공유된 기술 스택, 코드 스니펫, 향후 계획 등을 누락 없이 포함해주세요.
        *   반드시 한국어와 마크다운 문법(예: '-', '*', '#', '\`', '***')을 사용하여 가독성 좋고 전문적인 보고서 형식으로 작성해주세요.

    원본 텍스트:
    ---
    ${rawText}
    ---
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      content: { type: Type.STRING },
    },
    required: ["title", "content"]
  };

  try {
    console.log(`[Journal] Calling Gemini API (Model: gemini-2.0-flash)...`);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return parsed;
  } catch (error) {
    console.error("Journal generation error:", error);
    throw new Error("Failed to generate journal from AI.");
  }
};
