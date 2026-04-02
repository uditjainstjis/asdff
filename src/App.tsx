/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Search, Loader2, Send, BookOpen, Command } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";

// Initialize Gemini API
// Note: process.env.GEMINI_API_KEY is injected by the platform
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function App() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const responseRef = useRef<HTMLDivElement>(null);

  // Function to handle the AI query
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: searchQuery,
        config: {
          systemInstruction: "You are a concise and helpful assistant. Provide direct, accurate answers. Use markdown for formatting if needed. Keep it brief unless detail is necessary.",
        },
      });

      setResponse(response.text || "No response received.");
    } catch (err) {
      console.error("Gemini Error:", err);
      setError("Failed to fetch response. Please check your connection or API key.");
    } finally {
      setLoading(false);
    }
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
    // Update URL without refreshing to allow bookmarking/sharing
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("query", query);
    window.history.pushState({}, "", newUrl);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative max-w-3xl mx-auto px-6 pt-20 pb-32">
        {/* Header */}
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
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm"
          >
            Type below or use <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-300">?query=...</code> in the URL
          </motion.p>
        </header>

        {/* Search Bar */}
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

        {/* Results Area */}
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
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
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
                  <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                    {/* Simple markdown-like rendering for basic structure */}
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

        {/* Quick Tips */}
        {!response && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12"
          >
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer group" onClick={() => { setQuery("Explain Quantum Entanglement simply"); handleSearch("Explain Quantum Entanglement simply"); }}>
              <h3 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors">Quantum Physics</h3>
              <p className="text-gray-500 text-xs">"Explain Quantum Entanglement simply"</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors cursor-pointer group" onClick={() => { setQuery("Summary of the French Revolution"); handleSearch("Summary of the French Revolution"); }}>
              <h3 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors">History</h3>
              <p className="text-gray-500 text-xs">"Summary of the French Revolution"</p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 text-center text-gray-600 text-xs pointer-events-none">
        <p>Powered by Gemini 3 Flash • Built for speed</p>
      </footer>
    </div>
  );
}
