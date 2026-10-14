import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  tag?: string;
  statusDot?: 'emerald' | 'violet' | 'cyan' | 'rose' | 'slate';
  headerAction?: React.ReactNode;
  hudCorners?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  tag,
  statusDot,
  headerAction,
  hudCorners = true,
}) => {
  const dotColor = {
    emerald: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    violet: 'bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]',
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    rose: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]',
    slate: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]',
  }[statusDot || 'violet'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-panel rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:border-violet-500/30 ${
        hudCorners ? 'hud-corners' : ''
      } ${className}`}
    >
      {(title || subtitle || tag || headerAction) && (
        <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {statusDot && <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} />}
              {tag && (
                <span className="font-mono text-[9px] uppercase tracking-widest text-violet-400/90 font-semibold px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                  {tag}
                </span>
              )}
              {title && (
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-300">
                  {title}
                </h3>
              )}
            </div>
            {subtitle && (
              <p className="text-sm font-medium text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {children}

      {/* Ambient background glow corner */}
      <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-violet-600/5 blur-[50px] rounded-full pointer-events-none" />
    </motion.div>
  );
};
