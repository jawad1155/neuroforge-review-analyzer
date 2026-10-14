import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from './components/Layout/TopBar';
import { StatusStrip } from './components/Layout/StatusStrip';
import { NeuralCore } from './components/Core/NeuralCore';
import { UploadPortal } from './components/Core/UploadPortal';
import { MetricsGrid } from './components/Intelligence/MetricsGrid';
import { SentimentChart } from './components/Intelligence/SentimentChart';
import { SignalMap } from './components/Intelligence/SignalMap';
import { InsightsLab } from './components/Intelligence/InsightsLab';
import { IntelligenceFeed } from './components/Intelligence/IntelligenceFeed';
import { AskAIInterface } from './components/AI/AskAIInterface';
import { CommandPalette } from './components/AI/CommandPalette';
import { apiService, AnalysisResponse } from './lib/api';
import { DEFAULT_INTELLIGENCE } from './lib/mockData';
import { ArrowDown, Sparkles, Compass, ShieldCheck, Terminal, Cpu } from 'lucide-react';

function App() {
  const [analysisData, setAnalysisData] = useState<AnalysisResponse>(DEFAULT_INTELLIGENCE);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  // Check backend health on mount
  useEffect(() => {
    let isMounted = true;
    apiService.getHealth().then((res) => {
      if (isMounted) {
        setBackendOnline(res.status === 'healthy' || res.status === 'running');
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
  };

  const handleAnalysisComplete = (data: AnalysisResponse, file: File | null) => {
    setIsAnalyzing(false);
    setAnalysisData(data);
    setCurrentFile(file);
    // Smooth scroll down to metrics
    const metricsEl = document.getElementById('metrics-section');
    if (metricsEl) {
      metricsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAnalysisError = (error: string) => {
    setIsAnalyzing(false);
    console.error('Analysis Error:', error);
  };

  const handleLoadSample = () => {
    setAnalysisData(DEFAULT_INTELLIGENCE);
    setCurrentFile(null);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070910] text-slate-200 font-sans selection:bg-violet-500/30 neural-grid relative">
      {/* Cinematic Top Navigation Bar */}
      <TopBar
        workspaceName={currentFile?.name}
        isAnalyzing={isAnalyzing}
        backendOnline={backendOnline}
        totalSignals={analysisData.stats.total_reviews}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onLoadSample={handleLoadSample}
      />

      {/* Main Single-Page Command Center Canvas */}
      <main className="pt-24 pb-28 px-4 sm:px-6 lg:px-10 max-w-[1720px] mx-auto space-y-24">
        {/* ====================================================================
            SECTION 1: HERO - THE INTELLIGENCE CORE
           ==================================================================== */}
        <section id="hero-core" className="scroll-mt-28 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Vision, Title & Tactical Actions (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Technical Status Pill */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[11px] font-mono tracking-widest uppercase font-semibold"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                </span>
                <span>NEURAL INTELLIGENCE CORE // ACTIVE</span>
              </motion.div>

              {/* Required Headline & Supporting Text */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-mono"
                >
                  Decode Every <br />
                  <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent italic">
                    Customer Signal.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-slate-400 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-sans"
                >
                  Transform raw customer feedback into actionable intelligence. Ingest CSV datasets,
                  synthesize multi-class sentiment vectors, isolate friction nodes, and formulate strategic
                  remediation with real-time neural processing.
                </motion.p>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                {/* Primary Action */}
                <button
                  onClick={() => scrollTo('upload-portal')}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] flex items-center gap-2"
                >
                  <ArrowDown size={14} className="animate-bounce" />
                  <span>Analyze Reviews</span>
                </button>

                {/* Secondary Action */}
                <button
                  onClick={() => scrollTo('metrics-section')}
                  className="px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/10 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2"
                >
                  <Compass size={14} className="text-cyan-400" />
                  <span>Explore Intelligence</span>
                </button>

                {/* Quick Sample Action */}
                <button
                  onClick={handleLoadSample}
                  className="px-4 py-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 border border-white/[0.06] font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={13} className="text-violet-400" />
                  <span>Reset Benchmark</span>
                </button>
              </motion.div>

              {/* Live HUD Quick Counters */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="pt-6 border-t border-white/[0.06] grid grid-cols-3 gap-4 max-w-lg font-mono text-xs"
              >
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">TOTAL VOLUME</span>
                  <span className="text-lg font-bold text-white">
                    {analysisData.stats.total_reviews.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">AFFINITY SCORE</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {Math.round(analysisData.sentiment.positive)}% POS
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">LATENCY / STATUS</span>
                  <span className="text-lg font-bold text-cyan-400">NOMINAL</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Interactive 3D Canvas Neural Core (5 cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 h-[380px] sm:h-[440px] relative glass-panel rounded-2xl border border-violet-500/30 overflow-hidden hud-corners shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            >
              <NeuralCore />
            </motion.div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 2: INTERACTIVE UPLOAD PORTAL
           ==================================================================== */}
        <section className="scroll-mt-28">
          <UploadPortal
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisError={handleAnalysisError}
            onLoadSample={handleLoadSample}
          />
        </section>

        {/* ====================================================================
            SECTION 3: THE INTELLIGENCE METRICS
           ==================================================================== */}
        <section>
          <MetricsGrid stats={analysisData.stats} sentiment={analysisData.sentiment} />
        </section>

        {/* ====================================================================
            SECTION 4: SENTIMENT INTELLIGENCE
           ==================================================================== */}
        <section>
          <SentimentChart sentiment={analysisData.sentiment} />
        </section>

        {/* ====================================================================
            SECTION 5: CUSTOMER SIGNAL MAP
           ==================================================================== */}
        <section>
          <SignalMap
            positiveTopics={analysisData.positive_topics}
            negativeTopics={analysisData.negative_topics}
          />
        </section>

        {/* ====================================================================
            SECTION 6: AI INSIGHTS LAB
           ==================================================================== */}
        <section>
          <InsightsLab
            summary={analysisData.summary}
            praise={analysisData.common_praise}
            complaints={analysisData.common_complaints}
            recommendations={analysisData.recommendations}
          />
        </section>

        {/* ====================================================================
            SECTION 7 & 8: RECENT REVIEWS & ASK AI CONVERSATIONAL INTELLIGENCE
           ==================================================================== */}
        <section className="grid grid-cols-1 gap-16">
          <IntelligenceFeed reviews={analysisData.reviews} />
          <AskAIInterface reviews={analysisData.reviews.map((r) => r.text)} />
        </section>
      </main>

      {/* Refined Footer Status Strip */}
      <StatusStrip
        datasetName={currentFile?.name}
        totalSignals={analysisData.stats.total_reviews}
        backendOnline={backendOnline}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <AnimatePresence>
        {isPaletteOpen && (
          <CommandPalette
            onClose={() => setIsPaletteOpen(false)}
            onLoadSample={handleLoadSample}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
