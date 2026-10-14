import React, { useState, useEffect } from 'react';
import { Activity, Database, Command, ShieldCheck, Cpu } from 'lucide-react';

interface StatusStripProps {
  datasetName?: string;
  totalSignals?: number;
  backendOnline?: boolean;
}

export const StatusStrip: React.FC<StatusStripProps> = ({
  datasetName,
  totalSignals,
  backendOnline = true,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 w-full z-40 border-t border-white/[0.08] bg-[#070910]/90 backdrop-blur-xl h-8 px-4 sm:px-6 flex items-center justify-between font-mono text-[10px] text-slate-500 select-none">
      {/* Left: Backend & System Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendOnline
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
            }`}
          />
          <span className="text-slate-400">
            {backendOnline ? 'BACKEND: FASTAPI CONNECTED' : 'BACKEND: STANDALONE MODE'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-slate-500">
          <Cpu size={12} className="text-violet-400" />
          <span>INFERENCE: GROQ / GEMINI</span>
        </div>
      </div>

      {/* Center: Active Dataset */}
      <div className="hidden sm:flex items-center gap-2 text-slate-400">
        <Database size={11} className="text-cyan-400" />
        <span>DATASET:</span>
        <span className="text-slate-200 font-semibold truncate max-w-[200px]">
          {datasetName || 'Benchmark V2.csv'}
        </span>
        {totalSignals !== undefined && (
          <span className="text-violet-400">({totalSignals.toLocaleString()} signals)</span>
        )}
      </div>

      {/* Right: Keyboard Shortcut & Clock */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 text-slate-400">
          <Command size={11} className="text-violet-400" />
          <span>Press</span>
          <kbd className="px-1 py-0.5 rounded bg-white/[0.06] text-slate-300 text-[9px]">
            Ctrl + K
          </kbd>
          <span>for Command Palette</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span className="font-mono text-slate-300">{timeStr || '00:00:00'} UTC</span>
        </div>
      </div>
    </footer>
  );
};
