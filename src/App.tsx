/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Bookmark, History, Trash2, X, ChevronRight, Volume2 } from "lucide-react";
import { useState, useEffect } from "react";

// Types
interface ParaphraseResult {
  word: string;
  paraphrases: string[];
  explanation: string;
  id?: string;
}

export default function App() {
  const [inputWord, setInputWord] = useState("");
  const [result, setResult] = useState<ParaphraseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<ParaphraseResult[]>([]);
  const [showArchive, setShowArchive] = useState(false);

  // Load saved items on mount
  useEffect(() => {
    const saved = localStorage.getItem("lexi_archive");
    if (saved) {
      try {
        setSavedItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse archive", e);
      }
    }
  }, []);

  const handleParaphrase = async () => {
    if (!inputWord.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Paraphrase the English word "${inputWord}" into 3 simpler synonyms and provide a very short English explanation.`,
        config: {
          systemInstruction: "You are an urban English expert. Provide easy-to-understand paraphrases for learners. Return ONLY valid JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              paraphrases: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                minItems: 3,
                maxItems: 3
              },
              explanation: { type: Type.STRING }
            },
            required: ["word", "paraphrases", "explanation"]
          }
        },
      });

      const data = JSON.parse(response.text || "{}");
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch paraphrases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    // Check if already saved
    if (savedItems.some(item => item.word.toLowerCase() === result.word.toLowerCase())) {
      return;
    }
    const newItem = { ...result, id: Date.now().toString() };
    const updated = [newItem, ...savedItems];
    setSavedItems(updated);
    localStorage.setItem("lexi_archive", JSON.stringify(updated));
  };

  const deleteSaved = (id: string | undefined) => {
    if (!id) return;
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem("lexi_archive", JSON.stringify(updated));
  };

  const handleSpeak = (text: string) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
    const audio = new Audio(url);
    audio.play().catch(e => {
      console.error("Google TTS failed, falling back to Web Speech API:", e);
      // Fallback to browser synthesis if the URL method fails
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  const getResultColor = (index: number) => {
    switch (index % 3) {
      case 0: return "bg-editorial-lime text-black";
      case 1: return "bg-editorial-pink text-white";
      case 2: return "bg-editorial-cyan text-black";
      default: return "bg-white text-black";
    }
  };

  return (
    <div className="min-h-screen bg-editorial-black text-white flex flex-col p-6 md:p-12 font-sans max-w-[1440px] mx-auto overflow-x-hidden relative">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/20 pb-8">
        <div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none select-none">
            SWAP<span className="text-editorial-lime">.</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 mt-4 font-bold italic">Urban Lexicon Engine v.2.0</p>
        </div>
        <div className="flex items-end gap-6 mt-6 md:mt-0">
          <button 
            onClick={() => setShowArchive(true)}
            className="flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-editorial-lime hover:text-editorial-lime transition-all group"
          >
            <History size={16} className="group-hover:rotate-[-45deg] transition-transform" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Archive ({savedItems.length})</span>
          </button>
          <div className="text-left md:text-right font-mono">
            <div className="text-editorial-cyan text-sm flex items-center gap-2 md:justify-end">
              <span className="w-2 h-2 rounded-full bg-editorial-cyan animate-pulse" />
              STATUS: ACTIVE
            </div>
            <div className="text-xs text-white/40 uppercase tracking-widest mt-1">Powered by Gemini AI</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Input Panel */}
        <section className="md:col-span-4 flex flex-col justify-between h-full">
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-editorial-pink font-black block">Enter English Word</label>
              <div className="relative group">
                <input
                  type="text"
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleParaphrase()}
                  placeholder="Type here..."
                  className="w-full bg-transparent border-b-4 border-white text-4xl font-bold py-4 focus:outline-none focus:border-editorial-lime transition-all uppercase placeholder:normal-case placeholder:text-white/10 pr-12"
                />
                {inputWord && (
                  <button
                    onClick={() => setInputWord("")}
                    className="absolute right-12 bottom-6 p-1 text-white/30 hover:text-editorial-pink transition-colors cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                )}
                <div className="absolute right-0 bottom-4 text-white/20 font-mono text-xs italic animate-pulse">_cursor</div>
              </div>
            </div>

            <button
              onClick={handleParaphrase}
              disabled={loading || !inputWord.trim()}
              className="w-full py-8 bg-editorial-lime text-black font-black uppercase tracking-tighter text-3xl hover:bg-white transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4 group shadow-[8px_8px_0_rgba(204,255,0,0.2)] hover:shadow-none"
            >
              {loading ? (
                <Loader2 className="animate-spin text-black" size={32} />
              ) : (
                <>
                  REFINE_NOW
                  <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-editorial-pink font-mono text-xs uppercase tracking-tight">{error}</p>
            )}
          </div>
          
          <div className="bg-white/5 p-8 border-l-4 border-editorial-cyan mt-12 md:mt-0">
            <h3 className="text-[10px] uppercase font-bold tracking-widest mb-3 text-white/40 italic underline decoration-editorial-cyan">System Memo</h3>
            <p className="text-sm leading-relaxed text-white/70 italic font-medium">
              "Archived words are stored locally in your browser memory module."
            </p>
          </div>
        </section>

        {/* Results Panel */}
        <section className="md:col-span-8">
          <div className="grid grid-rows-1 md:grid-rows-3 gap-4 h-full relative">
            <AnimatePresence mode="popLayout">
              {result ? (
                result.paraphrases.map((word, i) => (
                  <motion.div
                    key={`${result.word}-${word}`}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                    className={`${getResultColor(i)} p-8 flex justify-between items-center group cursor-default`}
                  >
                    <div className="flex items-baseline gap-6 overflow-hidden">
                      <span className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none opacity-20 hidden md:block">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-4xl md:text-6xl font-bold tracking-tight uppercase truncate">{word}</span>
                    </div>
                    <div className="hidden sm:flex transition-all duration-500 w-16 h-16 border-4 border-current rounded-full items-center justify-center group-hover:rotate-45">
                      <span className="text-4xl font-black">→</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="row-span-3 border-4 border-white/5 flex items-center justify-center overflow-hidden">
                  <div className="text-[20vw] font-black text-white/[0.02] select-none tracking-tighter leading-none translate-y-8">
                    STANDBY
                  </div>
                </div>
              )}
            </AnimatePresence>
            
            {/* Contextual Save Button */}
            {result && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleSave}
                className="absolute -top-4 right-0 px-6 py-2 bg-white text-black font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-editorial-lime transition-colors z-20"
              >
                <Bookmark size={12} fill={savedItems.some(item => item.word.toLowerCase() === result.word.toLowerCase()) ? "black" : "none"} />
                {savedItems.some(item => item.word.toLowerCase() === result.word.toLowerCase()) ? "Word_Archived" : "Commit_To_Archive"}
              </motion.button>
            )}
          </div>
        </section>
      </main>

      {/* Footer / Explanation Area */}
      <footer className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-white/10 pt-10">
        <div className="hidden md:block col-span-1 border-r border-white/20">
          <span className="writing-vertical text-[10px] uppercase tracking-widest text-white/40 block transform rotate-180 h-full text-center">ANALYTIC_SCHEMA</span>
        </div>
        <div className="col-span-1 md:col-span-11 bg-white/5 p-8 md:p-10 rounded-sm relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-editorial-cyan/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="absolute -top-3 left-8 bg-editorial-black px-4 text-[10px] font-bold text-editorial-lime tracking-[0.3em] uppercase border border-white/10">
            Analysis_Result / 英語解説
          </div>
          
                <div className="relative">
            {result ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs uppercase font-mono text-editorial-cyan">ActiveWord:</span>
                    <span className="text-4xl font-black italic text-editorial-lime tracking-tighter">"{result.word}"</span>
                  </div>
                  <button 
                    onClick={() => handleSpeak(result.word)}
                    className="p-3 bg-editorial-lime text-black hover:bg-white transition-colors flex items-center gap-2 group/btn"
                  >
                    <Volume2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-black tracking-widest uppercase">Speak_Audio</span>
                  </button>
                </div>
                <p className="text-xl md:text-3xl font-light leading-tight text-white/90">
                  {result.explanation}
                </p>
              </motion.div>
            ) : (
              <div className="h-24 flex items-center">
                <p className="text-white/20 font-mono text-sm tracking-widest uppercase">Waiting for input stream...</p>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Archive Overlay */}
      <AnimatePresence>
        {showArchive && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowArchive(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-editorial-black border-l border-white/20 z-50 p-8 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)]"
            >
              <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                  Archives<span className="text-editorial-pink">.</span>
                </h2>
                <button 
                  onClick={() => setShowArchive(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
                {savedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/5 opacity-30 italic">
                    No records found in local memory
                  </div>
                ) : (
                  savedItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b border-white/10 pb-6 group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-editorial-pink uppercase">Entry:</span>
                          <h4 className="text-2xl font-black uppercase text-editorial-lime cursor-pointer hover:underline" onClick={() => {setResult(item); setInputWord(item.word); setShowArchive(false);}}>
                            {item.word}
                          </h4>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSpeak(item.word); }}
                            className="p-1 text-white/30 hover:text-editorial-cyan transition-colors"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={() => deleteSaved(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-white/40 hover:text-red-500 transition-all scale-75 group-hover:scale-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.paraphrases.map((p, idx) => (
                          <span key={idx} className="bg-white/5 px-2 py-1 text-[10px] font-bold tracking-widest text-white/50 uppercase flex items-center gap-1">
                            <ChevronRight size={10} className="text-editorial-cyan" />
                            {p}
                          </span>
                        ))}
                      </div>
                      
                      <p className="text-xs text-white/40 leading-relaxed font-medium line-clamp-2">
                        {item.explanation}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[8px] font-mono text-white/20 text-center tracking-[0.2em]">SYSTEM_ARCHIVE_STORAGE_MODULE v1.0.3</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global CSS for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CCFF00;
        }
      `}</style>
    </div>
  );
}

