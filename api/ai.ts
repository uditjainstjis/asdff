import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

const MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.5-pro",        
  "gemini-2.5-flash",    
  "gemini-2.5-flash-lite",
];

async function tryGenerate(apiKey: string, modelName: string, query: string) {
  if (!apiKey) return null;
  const genAI = new GoogleGenAI({ apiKey });
  const response = await genAI.models.generateContent({ 
    model: modelName,
    contents: query,
    config: {
      systemInstruction: "You are a concise assistant. Provide direct answers."
    }
  });
  return response.text;
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || searchParams.get('query');

  if (!query) {
    return new Response("Error: No query provided.", { status: 400 });
  }

  const keys = [
    process.env.API1 || process.env.GEMINI_API_KEY,
    process.env.API2,
    process.env.API3
  ].filter(Boolean) as string[];

  // Try each model
  for (const modelName of MODELS) {
    // Try each key for this model
    for (const key of keys) {
      try {
        const text = await tryGenerate(key, modelName, query);
        if (text) {
          return new Response(text, {
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      } catch (error) {
        console.error(`Failed with key ${key.substring(0, 8)}... and model ${modelName}:`, error);
        continue; // Try next key/model
      }
    }
  }

  return new Response("Error: All API keys and models failed. Check your quotas.", { status: 500 });
}
