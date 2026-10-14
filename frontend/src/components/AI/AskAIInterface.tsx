import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Bot, User, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { GlassCard } from '../Layout/GlassCard';
import { apiService, AskAIResponse } from '../../lib/api';

interface AskAIInterfaceProps {
  reviews: string[];
}

export const AskAIInterface: React.FC<AskAIInterfaceProps> = ({ reviews }) => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<
    Array<{
      question: string;
      answer: string;
      timestamp: string;
    }>
  >([
    {
      question: 'What are customers complaining about most?',
      answer:
        'Based on verified customer feedback, the primary complaints center around battery degradation under active noise cancellation (depleting around 18 hours instead of the advertised 30h) and occasional Bluetooth dropouts in RF-dense environments like transit hubs. A firmware update optimizing standby draw and BLE buffers is strongly recommended.',
      timestamp: 'Initial Benchmark',
    },
  ]);

  const suggestedQuestions = [
    'What are customers complaining about most?',
    'What do happy customers praise?',
    'Which issues should we prioritize?',
    'Summarize the most important findings.',
    'What should we improve next?',
  ];

  const handleAsk = async (questionText?: string) => {
    const q = (questionText || query).trim();
    if (!q) return;

    if (!reviews || reviews.length === 0) {
      setErrorState('Please stage or upload a dataset before querying the neural AI engine.');
      return;
    }

    setQuery('');
    setErrorState(null);
    setIsThinking(true);

    try {
      const response = await apiService.askAI(q, reviews);
      if (response && response.answer) {
        setChatHistory((prev) => [
          ...prev,
          {
            question: q,
            answer: response.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('Neural engine returned an empty response.');
      }
    } catch (err: any) {
      console.error('AskAI Query Error:', err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'The AI service could not respond. Ensure FastAPI is running on http://localhost:8000.';
      setErrorState(msg);
    } finally {
      setIsThinking(false);
    }
  };

  const copyAnswer = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="ask-ai-section" className="space-y-6 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/[0.06] pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-semibold block">
            INTERACTIVE REASONING // ZERO-SHOT SYNTHESIS
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Ask AI <span className="text-cyan-400">Intelligence</span>
          </h2>
        </div>
        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-2">
          <Sparkles size={12} className="text-cyan-400" />
          <span>CONTEXT: {reviews.length} VERIFIED REVIEWS</span>
        </div>
      </div>

      <GlassCard
        tag="NEURAL CONSOLE"
        statusDot="cyan"
        title="Conversational Diagnostic Console"
      >
        <div className="space-y-6">
          {/* Conversation Stream */}
          <div className="max-h-[460px] overflow-y-auto space-y-5 pr-2">
            <AnimatePresence initial={false}>
              {chatHistory.map((chat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {/* User Question */}
                  <div className="flex justify-end items-start gap-3 pl-8">
                    <div className="p-3.5 rounded-2xl rounded-tr-sm bg-violet-600/90 text-white text-xs sm:text-sm font-sans shadow-[0_0_15px_rgba(139,92,246,0.3)] max-w-xl">
                      <div className="flex items-center gap-2 font-mono text-[9px] text-violet-200 mb-1">
                        <User size={11} />
                        <span>OPERATOR QUERY · {chat.timestamp}</span>
                      </div>
                      <p>{chat.question}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start items-start gap-3 pr-8">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-1 shadow-[0_0_12px_rgba(34,211,238,0.2)]">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl rounded-tl-sm bg-[#090C16] border border-white/[0.08] text-slate-200 text-xs sm:text-sm leading-relaxed font-sans max-w-2xl relative group">
                      <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 mb-2 border-b border-white/[0.06] pb-1.5">
                        <span className="text-cyan-400 font-bold uppercase tracking-wider">
                          NEURAL SYNTHESIS // FASTAPI + GROQ
                        </span>
                        <button
                          onClick={() => copyAnswer(chat.answer, i)}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check size={11} className="text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap">{chat.answer}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Thinking / Synthesizing Indicator */}
            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 pr-8"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Loader2 size={16} className="animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[#090C16] border border-white/10 flex items-center gap-3 text-xs font-mono text-cyan-300">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Synthesizing cross-review inferences from {reviews.length} feedback vectors...</span>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {errorState && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorState}</span>
                </div>
                <button
                  onClick={() => handleAsk()}
                  className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 uppercase font-bold text-[10px]"
                >
                  Retry
                </button>
              </motion.div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="relative"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query customer feedback (e.g., 'What features cause the most customer churn?')..."
              disabled={isThinking}
              className="w-full bg-[#070910] border border-white/10 rounded-xl py-4 pl-5 pr-14 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_25px_rgba(34,211,238,0.15)] transition-all font-sans"
            />
            <button
              type="submit"
              disabled={isThinking || !query.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-black font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              <Send size={15} />
            </button>
          </form>

          {/* Quick Query Suggestion Chips */}
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500 mb-2">
              SUGGESTED NEURAL QUERIES
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((sq) => (
                <button
                  key={sq}
                  onClick={() => handleAsk(sq)}
                  disabled={isThinking}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white font-mono text-[10px] tracking-wide transition-all disabled:opacity-40"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
