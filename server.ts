import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini for the API endpoint
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Route for raw text response (Minimal for Jupyter)
  app.get("/api/ai", async (req, res) => {
    const query = (req.query.q || req.query.query) as string;
    
    if (!query) {
      return res.status(400).send("Error: No query provided. Use ?q=your+question");
    }

    try {
      const model = genAI.models.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        systemInstruction: "You are a concise assistant. Provide direct answers without conversational filler. Use plain text or simple markdown."
      });
      
      const result = await model.generateContent(query);
      const response = await result.response;
      const text = response.text();
      
      // Return raw text for easy printing in Jupyter
      res.setHeader('Content-Type', 'text/plain');
      res.send(text);
    } catch (error) {
      console.error("API Error:", error);
      res.status(500).send("Error: Failed to fetch AI response.");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
