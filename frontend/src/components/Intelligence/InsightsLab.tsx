import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../Layout/GlassCard';
import { Sparkles, AlertCircle, CheckCircle2, Copy, Check, Lightbulb, FileText, ChevronRight } from 'lucide-react';

interface InsightsLabProps {
  summary: string;
  praise: string[];
  complaints: string[];
  recommendations: string[];
}

export const InsightsLab: React.FC<InsightsLabProps> = ({
  summary,
  praise,
  complaints,
  recommendations,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="insights-section" className="space-y-6 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/[0.06] pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-violet-400 font-semibold block">
            SYNTHESIS // STRATEGIC ACTION MATRIX
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            AI Insights <span className="text-violet-400">Lab</span>
          </h2>
        </div>
        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-2">
          <Sparkles size={12} className="text-violet-400" />
          <span>ACTION MATRIX // REVIEW EVIDENCE</span>
        </div>
      </div>

      {/* 1. Executive Summary Panel */}
      <GlassCard
        tag="EXECUTIVE SYNTHESIS"
        statusDot="violet"
        title="Neural Summary"
        headerAction={
          <button
            onClick={() => copyToClipboard(summary, 'summary')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white font-mono text-[10px] transition-colors"
          >
            {copiedIndex === 'summary' ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        }
      >
        <div className="relative pl-6 py-2 border-l-2 border-violet-500">
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
            "{summary || 'Synthesizing comprehensive review intelligence...'}"
          </p>
          <div className="mt-3 flex items-center gap-3 text-[10px] font-mono text-slate-500">
            <span>SYNTHESIS: COMPLETE</span>
            <span>·</span>
            <span>SOURCE: ALL INGESTED FEEDBACK</span>
          </div>
        </div>
      </GlassCard>

      {/* 2. Tri-Column Patterns, Pain Points & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1: Value Drivers & Praise */}
        <GlassCard
          tag="OBSERVED PATTERNS"
          statusDot="emerald"
          title="Value Drivers & Praise"
        >
          <div className="space-y-3">
            {praise.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-slate-500 italic">
                No dominant praise patterns detected.
              </div>
            ) : (
              praise.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {item}
                      </p>
                      <span className="block mt-1 font-mono text-[9px] text-emerald-400/80 uppercase">
                        CUSTOMER DELIGHT FACTOR
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Column 2: Pain Points & Friction */}
        <GlassCard
          tag="OBSERVED FRICTION"
          statusDot="rose"
          title="Friction & Pain Points"
        >
          <div className="space-y-3">
            {complaints.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-slate-500 italic">
                No major complaints identified in this dataset.
              </div>
            ) : (
              complaints.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-3.5 rounded-xl bg-rose-500/[0.04] border border-rose-500/20 hover:border-rose-500/40 transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {item}
                      </p>
                      <span className="block mt-1 font-mono text-[9px] text-rose-400/80 uppercase">
                        CRITICAL REMEDIATION VECTOR
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Column 3: Strategic Recommendations */}
        <GlassCard
          tag="AI STRATEGY"
          statusDot="violet"
          title="Recommended Next Steps"
        >
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="p-4 text-center text-xs font-mono text-slate-500 italic">
                No actionable recommendations generated yet.
              </div>
            ) : (
              recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-3.5 rounded-xl bg-violet-500/[0.06] border border-violet-500/25 hover:border-violet-500/50 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start gap-2.5">
                    <Lightbulb size={15} className="text-violet-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-100 leading-relaxed font-medium">
                        {rec}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-violet-400/80">
                        <span>PRIORITY ACTION 0{i + 1}</span>
                        <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
