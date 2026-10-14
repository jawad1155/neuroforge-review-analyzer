import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../Layout/GlassCard';
import { Search, Filter, Star, ExternalLink, X, ArrowUpDown, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { ReviewItem } from '../../lib/api';

interface IntelligenceFeedProps {
  reviews: ReviewItem[];
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #7c4dff, #3b82f6)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #14b8a6, #3b82f6)',
  'linear-gradient(135deg, #6366f1, #22d3ee)',
];

const getAvatarGrad = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
};

export const IntelligenceFeed: React.FC<IntelligenceFeedProps> = ({ reviews }) => {
  const [filter, setFilter] = useState<'All' | 'Positive' | 'Neutral' | 'Negative'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'rating-desc' | 'rating-asc' | 'length-desc'>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  const ITEMS_PER_PAGE = 6;

  // Filter & Search
  const filteredAndSorted = useMemo(() => {
    let result = reviews.filter((rev) => {
      const matchesFilter = filter === 'All' || rev.sentiment.toLowerCase() === filter.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        rev.text.toLowerCase().includes(query) ||
        rev.name.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });

    // Sorting
    if (sortBy === 'rating-desc') {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating-asc') {
      result = [...result].sort((a, b) => a.rating - b.rating);
    } else if (sortBy === 'length-desc') {
      result = [...result].sort((a, b) => b.text.length - a.text.length);
    }

    return result;
  }, [reviews, filter, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSorted, currentPage]);

  const handleFilterChange = (newFilter: 'All' | 'Positive' | 'Neutral' | 'Negative') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div id="reviews-section" className="space-y-6 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/[0.06] pb-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-violet-400 font-semibold block">
            VERIFIED SIGNALS // AUDIT & SURVEILLANCE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Recent Reviews <span className="text-violet-400">Explorer</span>
          </h2>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          SHOWING {paginatedReviews.length} OF {filteredAndSorted.length} SIGNALS ({reviews.length} TOTAL)
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-white/10">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search signals by keyword or author..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-9 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills and Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sentiment Filter Tabs */}
          <div className="flex items-center p-1 rounded-lg bg-black/40 border border-white/10 font-mono text-[10px]">
            {(['All', 'Positive', 'Neutral', 'Negative'] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-3 py-1.5 rounded-md font-bold uppercase transition-all ${
                  filter === f
                    ? f === 'Positive'
                      ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : f === 'Negative'
                      ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(251,113,133,0.5)]'
                      : f === 'Neutral'
                      ? 'bg-slate-600 text-white'
                      : 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-slate-300">
            <ArrowUpDown size={12} className="text-violet-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-200 cursor-pointer font-mono"
            >
              <option value="default" className="bg-[#0D1120]">Order: Default</option>
              <option value="rating-desc" className="bg-[#0D1120]">Rating: High to Low</option>
              <option value="rating-asc" className="bg-[#0D1120]">Rating: Low to High</option>
              <option value="length-desc" className="bg-[#0D1120]">Length: Longest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      {paginatedReviews.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-xl border border-white/10">
          <p className="text-sm font-mono text-slate-400 mb-3">No customer reviews match your active query.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilter('All');
              setSortBy('default');
            }}
            className="px-4 py-2 rounded bg-violet-600 text-white font-mono text-xs uppercase tracking-wider"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {paginatedReviews.map((rev, i) => {
              const isPositive = rev.sentiment.toLowerCase() === 'positive';
              const isNegative = rev.sentiment.toLowerCase() === 'negative';

              return (
                <motion.div
                  key={`${rev.name}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  onClick={() => setSelectedReview(rev)}
                  className="glass-panel p-5 rounded-xl border border-white/[0.08] hover:border-violet-500/40 transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                >
                  <div>
                    {/* Header: Avatar, Name, Rating, Sentiment Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          style={{ background: getAvatarGrad(rev.name) }}
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0 uppercase"
                        >
                          {rev.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-xs text-white block truncate">
                            {rev.name}
                          </span>
                          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block">
                            VERIFIED CUSTOMER
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border shrink-0 ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isNegative
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {rev.sentiment}
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={
                            star <= Math.round(rev.rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-white/10'
                          }
                        />
                      ))}
                      <span className="font-mono text-[10px] text-slate-400 ml-1.5 font-bold">
                        {rev.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Review text */}
                    <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-4">
                      "{rev.text}"
                    </p>
                  </div>

                  {/* Card Footer: Detail Link */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{rev.text.length} CHARS</span>
                    <span className="text-violet-400 font-semibold group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                      Expand Signal <ExternalLink size={10} />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] font-mono text-xs text-slate-400">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          <span className="text-[11px]">
            PAGE <strong className="text-white">{currentPage}</strong> OF {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Selected Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReview(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl glass-panel-elevated p-6 sm:p-8 rounded-2xl border border-violet-500/40 hud-corners z-10 space-y-6"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    style={{ background: getAvatarGrad(selectedReview.name) }}
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base shadow-lg uppercase"
                  >
                    {selectedReview.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedReview.name}</h3>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">
                      SIGNAL ID: SYN-{Math.floor(Math.random() * 9000 + 1000)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReview(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={
                        star <= Math.round(selectedReview.rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-white/10'
                      }
                    />
                  ))}
                  <span className="ml-1 text-white font-bold">{selectedReview.rating} / 5.0</span>
                </div>
                <span className="text-slate-600">|</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    selectedReview.sentiment.toLowerCase() === 'positive'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : selectedReview.sentiment.toLowerCase() === 'negative'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                  }`}
                >
                  {selectedReview.sentiment}
                </span>
              </div>

              {/* Full Review Text */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  "{selectedReview.text}"
                </p>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Dismiss Signal Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
