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

    const keys = [
      process.env.API1 || process.env.GEMINI_API_KEY,
      process.env.API2,
      process.env.API3
    ].filter(Boolean) as string[];

    const MODELS = [
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-3.1-pro-preview"
    ];

    for (const modelName of MODELS) {
      for (const key of keys) {
        try {
          const genAI = new GoogleGenAI({ apiKey: key });
          const response = await genAI.models.generateContent({ 
            model: modelName,
            contents: query,
            config: {
              systemInstruction: "You are a concise assistant. Provide direct answers."
            }
          });
          
          res.setHeader('Content-Type', 'text/plain');
          return res.send(response.text);
        } catch (error) {
          console.error(`Local Fallback failed with key ${key.substring(0, 8)}... and model ${modelName}`);
          continue;
        }
      }
    }

    res.status(500).send("Error: All fallback keys and models failed.");
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
