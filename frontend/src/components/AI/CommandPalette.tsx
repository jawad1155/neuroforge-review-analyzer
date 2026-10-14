import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Command,
  Search,
  Upload,
  LayoutDashboard,
  PieChart,
  Radio,
  Lightbulb,
  ListFilter,
  MessageSquare,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';

interface CommandPaletteProps {
  onClose: () => void;
  onLoadSample: () => void;
}

interface CommandItem {
  id: string;
  category: string;
  label: string;
  shortcut?: string;
  icon: React.ElementType;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, onLoadSample }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollTo = (id: string) => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const commands: CommandItem[] = [
    {
      id: 'cmd-upload',
      category: 'Navigation',
      label: 'Jump to Dataset Ingestion & Upload',
      shortcut: 'G U',
      icon: Upload,
      action: () => scrollTo('upload-portal'),
    },
    {
      id: 'cmd-metrics',
      category: 'Navigation',
      label: 'Jump to Intelligence Metrics',
      shortcut: 'G M',
      icon: LayoutDashboard,
      action: () => scrollTo('metrics-section'),
    },
    {
      id: 'cmd-sentiment',
      category: 'Navigation',
      label: 'Jump to Sentiment Intelligence',
      shortcut: 'G S',
      icon: PieChart,
      action: () => scrollTo('sentiment-section'),
    },
    {
      id: 'cmd-signals',
      category: 'Navigation',
      label: 'Jump to Customer Signal Map',
      shortcut: 'G C',
      icon: Radio,
      action: () => scrollTo('signal-map-section'),
    },
    {
      id: 'cmd-insights',
      category: 'Navigation',
      label: 'Jump to AI Insights Lab',
      shortcut: 'G I',
      icon: Lightbulb,
      action: () => scrollTo('insights-section'),
    },
    {
      id: 'cmd-reviews',
      category: 'Navigation',
      label: 'Jump to Recent Reviews Explorer',
      shortcut: 'G R',
      icon: ListFilter,
      action: () => scrollTo('reviews-section'),
    },
    {
      id: 'cmd-ask-ai',
      category: 'Navigation',
      label: 'Jump to Ask AI Interactive Console',
      shortcut: 'G A',
      icon: MessageSquare,
      action: () => scrollTo('ask-ai-section'),
    },
    {
      id: 'cmd-load-sample',
      category: 'Actions',
      label: 'Load Benchmark Real Review Dataset',
      shortcut: 'ALT S',
      icon: Sparkles,
      action: () => {
        onClose();
        onLoadSample();
      },
    },
    {
      id: 'cmd-scroll-top',
      category: 'Actions',
      label: 'Scroll to Intelligence Core (Top)',
      shortcut: 'HOME',
      icon: RefreshCw,
      action: () => {
        onClose();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* Palette Window */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl glass-panel-elevated rounded-2xl border border-violet-500/40 hud-corners overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-10"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <Command size={18} className="text-violet-400 shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or jump to section..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 font-mono text-sm"
          />
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">
              ESC
            </kbd>
            <button onClick={onClose} className="text-slate-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Command List */}
        <div className="py-2 max-h-[360px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-slate-500 italic">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = selectedIndex === index;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-5 py-3 transition-colors text-left font-mono text-xs ${
                    isSelected
                      ? 'bg-violet-600/20 text-white border-l-2 border-violet-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={16}
                      className={isSelected ? 'text-cyan-400' : 'text-slate-500'}
                    />
                    <span className="font-medium text-slate-200">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-slate-600">
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 text-[9px] text-slate-400">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-5 py-2.5 border-t border-white/[0.06] bg-black/40 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to execute</span>
          </div>
          <span>NEUROFORGE PALETTE V4.8</span>
        </div>
      </motion.div>
    </div>
  );
};
