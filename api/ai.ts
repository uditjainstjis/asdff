import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || searchParams.get('query');

  if (!query) {
    return new Response("Error: No query provided.", { status: 400 });
  }

  // Use the API key from environment variables
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  try {
    const model = genAI.models.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction: "You are a concise assistant. Provide direct answers without conversational filler."
    });
    
    const result = await model.generateContent(query);
    const response = await result.response;
    const text = response.text();

    return new Response(text, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error("Vercel API Error:", error);
    return new Response("Error: Failed to fetch AI response.", { status: 500 });
  }
}
