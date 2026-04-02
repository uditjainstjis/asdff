/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Search, Loader2, Send, BookOpen, Command, AlertCircle } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";

// Fallback logic for frontend
const getAIClient = (keyIndex: number) => {
  const keys = [
    process.env.API1 || process.env.GEMINI_API_KEY,
    process.env.API2,
    process.env.API3
  ].filter(Boolean) as string[];
  
  const apiKey = keys[keyIndex] || "";
  return new GoogleGenAI({ apiKey });
};

const MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-pro-preview"
];

export default function App() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const responseRef = useRef<HTMLDivElement>(null);

  // Function to handle the AI query with fallback
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError("");
    setResponse("");

    const keysCount = [
      process.env.API1 || process.env.GEMINI_API_KEY,
      process.env.API2,
      process.env.API3
    ].filter(Boolean).length;

    // Try each model
    for (const modelName of MODELS) {
      // Try each key for this model
      for (let i = 0; i < Math.max(1, keysCount); i++) {
        try {
          const ai = getAIClient(i);
          const result = await ai.models.generateContent({
            model: modelName,
            contents: searchQuery,
            config: {
              systemInstruction: "You are a concise and helpful assistant. Provide direct, accurate answers.",
            },
          });

          if (result.text) {
            setResponse(result.text);
            setLoading(false);
            return;
          }
        } catch (err: any) {
          console.error(`Frontend failed with model ${modelName} and key index ${i}:`, err);
          continue; // Try next key/model
        }
      }
    }

    setError("All API keys and models failed. Please check your connection and ensure your keys are set in the Secrets panel.");
    setLoading(false);
  };

  // Check for URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get("query") || params.get("q");
    
    if (urlQuery) {
      setQuery(urlQuery);
      handleSearch(urlQuery);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("query", query);
    window.history.pushState({}, "", newUrl);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative max-w-3xl mx-auto px-6 pt-20 pb-32">
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4"
          >
            <Command size={14} />
            <span>Quick AI Lookup</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold tracking-tight text-white mb-4"
          >
            What do you want to <span className="text-blue-400">know?</span>
          </motion.h1>
        </header>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="relative group mb-12"
        >
          <div className="absolute inset-0 bg-blue-500/20 blur-xl group-focus-within:bg-blue-500/30 transition-all duration-500 rounded-2xl opacity-0 group-focus-within:opacity-100" />
          <div className="relative flex items-center">
            <Search className="absolute left-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-3 p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </motion.form>

        <AnimatePresence mode="wait">
          {(loading || response || error) && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {loading && !response && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <p className="text-sm animate-pulse">Consulting Gemini...</p>
                </div>
              )}

              {response && (
                <div 
                  ref={responseRef}
                  className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 text-blue-400 mb-6 font-medium text-sm uppercase tracking-wider">
                    <BookOpen size={16} />
                    <span>Response</span>
                  </div>
                  <div className="prose prose-invert max-w-none prose-p:leading-relaxed">
                    {response.split('\n').map((line, i) => (
                      <p key={i} className="mb-4 text-gray-300">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
