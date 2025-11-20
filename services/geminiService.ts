import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Category, TransactionType } from "../types";

const MODEL_NAME = "gemini-2.5-flash";

// Declare extended window interface for TS
declare global {
  interface Window {
    API_KEY?: string;
    process?: any;
  }
}

// --- API KEY OMNI-SEARCH STRATEGY ---
// Checks multiple locations for the API Key to ensure compatibility 
// across different deployment targets (Netlify, Vercel, Vite, Standard HTML)
export const retrieveApiKey = (): { key: string | undefined; source: string } => {
  // 1. Check standard process.env (Node/Webpack/Pollyfilled)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return { key: process.env.API_KEY, source: 'process.env' };
  }

  // 2. Check import.meta.env (Vite/Modern Bundlers)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.API_KEY) return { key: import.meta.env.API_KEY, source: 'import.meta.env.API_KEY' };
      // @ts-ignore
      if (import.meta.env.VITE_API_KEY) return { key: import.meta.env.VITE_API_KEY, source: 'VITE_API_KEY' };
      // @ts-ignore
      if (import.meta.env.REACT_APP_API_KEY) return { key: import.meta.env.REACT_APP_API_KEY, source: 'REACT_APP_API_KEY' };
    }
  } catch (e) {
    // import.meta might not exist in some environments
  }

  // 3. Check global window object (Manual Injection)
  if (typeof window !== 'undefined' && window.API_KEY) {
    return { key: window.API_KEY, source: 'window.API_KEY' };
  }

  // 4. Check LocalStorage (Emergency Fallback for manual overrides)
  if (typeof window !== 'undefined' && window.localStorage) {
    const localKey = window.localStorage.getItem('gemini_api_key');
    if (localKey) return { key: localKey, source: 'LocalStorage' };
  }

  return { key: undefined, source: 'Missing' };
};

// Helper to get AI instance safely
const getAiClient = () => {
  const { key, source } = retrieveApiKey();
  if (!key) {
    console.error("API Key retrieval failed. Checked: process.env, import.meta.env, window, localStorage.");
    throw new Error("API Key is missing. Source: " + source);
  }
  // Log only the source for security, not the key itself
  console.log(`Initializing AI Client using key from: ${source}`);
  return new GoogleGenAI({ apiKey: key });
};

// Define the expected response structure for a transaction
const transactionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    amount: {
      type: Type.NUMBER,
      description: "The monetary value of the transaction.",
    },
    category: {
      type: Type.STRING,
      enum: Object.values(Category),
      description: "The category that best fits the transaction.",
    },
    description: {
      type: Type.STRING,
      description: "A brief description of the transaction (e.g., 'Lunch at cafe', 'Taxi to airport').",
    },
    type: {
      type: Type.STRING,
      enum: [TransactionType.EXPENSE, TransactionType.INCOME],
      description: "Whether this is an expense or income.",
    },
    date: {
      type: Type.STRING,
      description: "The date of the transaction in ISO 8601 format (YYYY-MM-DD).",
    }
  },
  required: ["amount", "category", "description", "type", "date"],
};

export interface AIParseResult {
  amount: number;
  category: Category;
  description: string;
  date: string;
  type: TransactionType;
}

const getShanghaiDateInfo = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Shanghai',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  };
  return now.toLocaleString('zh-CN', options);
};

export const parseAudioTransaction = async (audioBase64: string, mimeType: string): Promise<AIParseResult> => {
  const currentDateTime = getShanghaiDateInfo();
  // Initialize client inside the function to ensure environment is ready
  const ai = getAiClient(); 
  
  console.log(`Sending audio to Gemini. Mime: ${mimeType}, Length: ${audioBase64.length}`);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, // Use the actual detected mime type
              data: audioBase64,
            },
          },
          {
            text: `Listen to this audio log. Extract the transaction details. 
            The current time in Asia/Shanghai (UTC+8) is ${currentDateTime}. 
            Use this reference to calculate relative dates like 'today', 'yesterday', or 'last Friday' into YYYY-MM-DD format.
            If no currency is mentioned, assume Chinese Yuan (CNY/RMB). Only return the number.
            Categorize the transaction into one of the provided Chinese categories.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
        temperature: 0.1,
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(response.text);
    return data as AIParseResult;
  } catch (error) {
    console.error("Error parsing audio transaction:", error);
    throw error;
  }
};

export const parseTextTransaction = async (text: string): Promise<AIParseResult> => {
  const currentDateTime = getShanghaiDateInfo();
  const ai = getAiClient(); 

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: `Analyze this transaction note: "${text}". Extract the details.
            The current time in Asia/Shanghai (UTC+8) is ${currentDateTime}.
            Use this reference for any relative date calculations.
            Assume the currency is Chinese Yuan (CNY) if not specified.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
        temperature: 0.1,
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(response.text);
    return data as AIParseResult;
  } catch (error) {
    console.error("Error parsing text transaction:", error);
    throw error;
  }
};