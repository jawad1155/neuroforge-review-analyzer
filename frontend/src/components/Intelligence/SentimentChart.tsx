import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { GlassCard } from '../Layout/GlassCard';
import { CheckCircle2, MinusCircle, AlertCircle, Info } from 'lucide-react';

interface SentimentChartProps {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

const COLORS = {
  positive: '#10B981',
  neutral: '#64748B',
  negative: '#FB7185',
};

export const SentimentChart: React.FC<SentimentChartProps> = ({ sentiment }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = [
    { name: 'Positive', value: Number(sentiment.positive || 0), color: COLORS.positive },
    { name: 'Neutral', value: Number(sentiment.neutral || 0), color: COLORS.neutral },
    { name: 'Negative', value: Number(sentiment.negative || 0), color: COLORS.negative },
  ];

  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 100;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="glass-panel p-3 rounded-lg border border-white/10 shadow-xl font-mono text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.payload.color }}
            />
            <span className="font-bold text-white uppercase">{entry.name} Sentiment</span>
          </div>
          <span className="text-slate-300">
            Vector Weight: <strong className="text-white">{entry.value.toFixed(1)}%</strong>
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="sentiment-section" className="space-y-6 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/[0.06] pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 font-semibold block">
            CLASSIFICATION // MULTI-CLASS VECTOR DISTRIBUTION
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Sentiment <span className="text-emerald-400">Intelligence</span>
          </h2>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          <span>MODEL CONFIDENCE: &gt; 98.4%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Donut Visual (7 cols) */}
        <GlassCard
          className="lg:col-span-7 flex flex-col justify-between"
          tag="EMOTIONAL POLARITY"
          title="Vector Topology"
        >
          <div className="h-[280px] sm:h-[320px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={118}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="rgba(7, 9, 16, 0.8)"
                  strokeWidth={2}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                      className="transition-all duration-300 cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Holographic Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {activeIndex !== null ? data[activeIndex].value.toFixed(0) : sentiment.positive.toFixed(0)}%
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mt-1">
                {activeIndex !== null ? data[activeIndex].name : 'Positive Affinity'}
              </span>
            </div>
          </div>

          {/* Continuous Spectrum Bar */}
          <div className="space-y-2 pt-4 border-t border-white/[0.06]">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">Positive ({sentiment.positive.toFixed(1)}%)</span>
              <span className="text-slate-400">Neutral ({sentiment.neutral.toFixed(1)}%)</span>
              <span className="text-rose-400 font-bold">Negative ({sentiment.negative.toFixed(1)}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden flex p-0.5 border border-white/10">
              <div
                style={{ width: `${sentiment.positive}%` }}
                className="bg-emerald-500 h-full rounded-l-full shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-700"
              />
              <div
                style={{ width: `${sentiment.neutral}%` }}
                className="bg-slate-500 h-full transition-all duration-700"
              />
              <div
                style={{ width: `${sentiment.negative}%` }}
                className="bg-rose-500 h-full rounded-r-full shadow-[0_0_10px_rgba(251,113,133,0.8)] transition-all duration-700"
              />
            </div>
          </div>
        </GlassCard>

        {/* Breakdown Breakdown Cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {/* Positive Card */}
          <GlassCard
            className="flex-1 border-l-4 border-l-emerald-500"
            tag="POSITIVE COHORT"
            title="Advocate Signals"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <span className="text-2xl font-bold font-mono text-white">
                    {sentiment.positive.toFixed(1)}%
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    High consumer satisfaction & delight
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Neutral Card */}
          <GlassCard
            className="flex-1 border-l-4 border-l-slate-400"
            tag="NEUTRAL COHORT"
            title="Equivocal Signals"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-500/10 text-slate-400">
                  <MinusCircle size={20} />
                </div>
                <div>
                  <span className="text-2xl font-bold font-mono text-white">
                    {sentiment.neutral.toFixed(1)}%
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Balanced or conditional product feedback
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Negative Card */}
          <GlassCard
            className="flex-1 border-l-4 border-l-rose-500"
            tag="NEGATIVE COHORT"
            title="Friction Signals"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <span className="text-2xl font-bold font-mono text-white">
                    {sentiment.negative.toFixed(1)}%
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Product pain points & user frustration
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
