import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../Layout/GlassCard';
import { Zap, AlertOctagon, Radio, Compass, ShieldAlert, CheckCircle } from 'lucide-react';
import { TopicItem } from '../../lib/api';

interface SignalMapProps {
  positiveTopics: TopicItem[];
  negativeTopics: TopicItem[];
}

export const SignalMap: React.FC<SignalMapProps> = ({ positiveTopics, negativeTopics }) => {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  const maxPositive = Math.max(...positiveTopics.map((t) => t.percent), 1);
  const maxNegative = Math.max(...negativeTopics.map((t) => t.percent), 1);

  return (
    <div id="signal-map-section" className="space-y-6 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/[0.06] pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-semibold block">
            SEMANTIC TOPOLOGY // CLUSTER CORRELATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Customer <span className="text-cyan-400">Signal Map</span>
          </h2>
        </div>
        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-2">
          <Radio size={12} className="text-cyan-400 animate-pulse" />
          <span>REAL-TIME SEMANTIC EMBEDDINGS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positive Signal Resonance */}
        <GlassCard
          tag="AMPLIFICATION NODES"
          statusDot="emerald"
          title="Value Drivers & Praise"
          headerAction={
            <span className="font-mono text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {positiveTopics.length} Clustered Nodes
            </span>
          }
        >
          {positiveTopics.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-slate-500 italic">
              No positive signal clusters extracted from this dataset.
            </div>
          ) : (
            <div className="space-y-4">
              {positiveTopics.map((topic, i) => {
                const isHovered = hoveredTopic === topic.name;
                const relativeWidth = Math.max(10, Math.min(100, (topic.percent / maxPositive) * 100));

                return (
                  <motion.div
                    key={i}
                    onMouseEnter={() => setHoveredTopic(topic.name)}
                    onMouseLeave={() => setHoveredTopic(null)}
                    className={`p-3.5 rounded-xl border transition-all duration-300 ${
                      isHovered
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2 font-mono">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className={isHovered ? 'text-emerald-400' : 'text-slate-500'} />
                        <span className="text-xs font-semibold text-white tracking-wide">
                          {topic.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">
                        {topic.percent}%
                      </span>
                    </div>

                    {/* Glowing Track */}
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${relativeWidth}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.08, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                      />
                    </div>

                    <div className="mt-2 flex justify-between items-center text-[9px] font-mono text-slate-500">
                      <span>CLUSTER ID: POS-0{i + 1}</span>
                      <span className="text-emerald-400/80 font-medium">HIGH ADVOCACY NODE</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Negative Signal Vectors */}
        <GlassCard
          tag="FRICTION VECTORS"
          statusDot="rose"
          title="Pain Points & Complaints"
          headerAction={
            <span className="font-mono text-[10px] text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
              {negativeTopics.length} Critical Vectors
            </span>
          }
        >
          {negativeTopics.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-slate-500 italic">
              No negative friction vectors detected in this dataset.
            </div>
          ) : (
            <div className="space-y-4">
              {negativeTopics.map((topic, i) => {
                const isHovered = hoveredTopic === topic.name;
                const relativeWidth = Math.max(10, Math.min(100, (topic.percent / maxNegative) * 100));

                return (
                  <motion.div
                    key={i}
                    onMouseEnter={() => setHoveredTopic(topic.name)}
                    onMouseLeave={() => setHoveredTopic(null)}
                    className={`p-3.5 rounded-xl border transition-all duration-300 ${
                      isHovered
                        ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_0_20px_rgba(251,113,133,0.15)]'
                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2 font-mono">
                      <div className="flex items-center gap-2">
                        <AlertOctagon size={14} className={isHovered ? 'text-rose-400' : 'text-slate-500'} />
                        <span className="text-xs font-semibold text-white tracking-wide">
                          {topic.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-rose-400">
                        {topic.percent}%
                      </span>
                    </div>

                    {/* Glowing Track */}
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${relativeWidth}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.08, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-[0_0_10px_rgba(251,113,133,0.6)]"
                      />
                    </div>

                    <div className="mt-2 flex justify-between items-center text-[9px] font-mono text-slate-500">
                      <span>VECTOR ID: FRICTION-0{i + 1}</span>
                      <span className="text-rose-400/80 font-medium">PRIORITY REMEDIATION</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
