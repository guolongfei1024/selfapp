import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Category, TransactionType } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

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

export const parseAudioTransaction = async (audioBase64: string): Promise<AIParseResult> => {
  const currentDateTime = getShanghaiDateInfo();
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/wav", // Assuming WAV from MediaRecorder
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