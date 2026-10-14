import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Command, Menu, X, Activity, Database, Sparkles } from 'lucide-react';

interface TopBarProps {
  workspaceName?: string;
  isAnalyzing?: boolean;
  backendOnline?: boolean;
  totalSignals?: number;
  onOpenPalette: () => void;
  onLoadSample: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  workspaceName,
  isAnalyzing = false,
  backendOnline = true,
  totalSignals,
  onOpenPalette,
  onLoadSample,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Ingest', href: '#upload-portal' },
    { label: 'Metrics', href: '#metrics-section' },
    { label: 'Sentiment', href: '#sentiment-section' },
    { label: 'Signals', href: '#signal-map-section' },
    { label: 'Insights', href: '#insights-section' },
    { label: 'Recent Reviews', href: '#reviews-section' },
    { label: 'Ask AI', href: '#ask-ai-section' },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/[0.08] bg-[#070910]/85 backdrop-blur-2xl">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Technical Label */}
        <div className="flex items-center gap-4">
          <a
            href="#hero-core"
            onClick={(e) => handleScrollTo(e, '#hero-core')}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="absolute -inset-1.5 bg-violet-600/30 rounded-lg blur-md group-hover:bg-violet-500/50 transition-all duration-500" />
              <div className="relative w-9 h-9 rounded-lg bg-[#0D1120] border border-violet-500/30 flex items-center justify-center overflow-hidden">
                <Brain size={19} className="text-violet-400 group-hover:text-cyan-400 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-500/20 to-transparent pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider uppercase text-white font-mono">
                  Neuro<span className="text-violet-400">Forge</span>
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 uppercase font-semibold">
                  OS 4.8
                </span>
              </div>
              <span className="text-[9px] font-mono tracking-widest uppercase text-slate-500">
                Neural Intelligence Command
              </span>
            </div>
          </a>

          {/* Dataset Status Tag */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] font-mono text-[10px]">
            <Database size={11} className="text-cyan-400" />
            <span className="text-slate-400">DATASET:</span>
            <span className="text-slate-200 truncate max-w-[150px] font-medium">
              {workspaceName || 'Benchmark V2.csv'}
            </span>
            {totalSignals !== undefined && (
              <span className="text-violet-400 font-bold ml-1">
                ({totalSignals.toLocaleString()} signals)
              </span>
            )}
          </div>
        </div>

        {/* Center: In-Page Navigation */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className="px-2.5 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <span className="text-slate-600 mr-1">//</span>
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Telemetry & Actions */}
        <div className="flex items-center gap-3">
          {/* Real AI Engine Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] font-mono text-[10px]">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isAnalyzing
                    ? 'bg-cyan-400'
                    : backendOnline
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isAnalyzing
                    ? 'bg-cyan-500'
                    : backendOnline
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-slate-300 font-medium">
              {isAnalyzing
                ? 'SYNTHESIZING'
                : backendOnline
                ? 'AI ONLINE'
                : 'LOCAL MODE'}
            </span>
          </div>

          {/* Quick Demo Dataset Button */}
          <button
            onClick={onLoadSample}
            title="Load Sample Real Dataset"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider text-slate-300 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 transition-all hover:border-violet-500/60"
          >
            <Sparkles size={12} className="text-violet-400" />
            <span>Sample Demo</span>
          </button>

          {/* Command Palette Button */}
          <button
            onClick={onOpenPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-mono text-slate-300 hover:text-white transition-all group"
          >
            <Command size={13} className="text-violet-400 group-hover:text-cyan-400 transition-colors" />
            <span className="hidden sm:inline font-bold">Palette</span>
            <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-white/[0.08] text-[9px] text-slate-400 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded text-slate-400 hover:text-white hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-b border-white/10 bg-[#070910] px-6 py-4 space-y-2"
          >
            <div className="flex items-center justify-between py-2 border-b border-white/5 font-mono text-[10px]">
              <span className="text-slate-500">ACTIVE DATASET</span>
              <span className="text-violet-400 font-semibold">{workspaceName || 'Benchmark V2.csv'}</span>
            </div>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="block py-2 text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-white hover:pl-2 transition-all"
              >
                <span className="text-slate-600 mr-2">//</span>
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/5 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoadSample();
                }}
                className="w-full py-2 rounded bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-mono font-bold uppercase"
              >
                Load Sample
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
