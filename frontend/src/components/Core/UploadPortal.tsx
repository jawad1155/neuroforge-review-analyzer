import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, AlertTriangle, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { apiService, AnalysisResponse } from '../../lib/api';

interface UploadPortalProps {
  onAnalysisStart?: () => void;
  onAnalysisComplete: (data: AnalysisResponse, file: File | null) => void;
  onAnalysisError: (error: string) => void;
  onLoadSample: () => void;
}

export const UploadPortal: React.FC<UploadPortalProps> = ({
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  onLoadSample,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const steps = [
    'Transmitting CSV payload to intelligence backend...',
    'Synthesizing customer sentiment vectors via Groq / Gemini...',
    'Extracting semantic friction nodes and praise drivers...',
    'Finalizing executive summary & intelligence map...',
  ];

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Invalid file type. Please upload a standard CSV file (.csv).');
      setStatus('error');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10 MB limit. Please compress or truncate.');
      setStatus('error');
      return;
    }

    setFile(selectedFile);
    setStatus('idle');
    setErrorMessage('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;

    setStatus('analyzing');
    setAnalysisStep(0);
    onAnalysisStart?.();

    // Step progression animation while request is in flight
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      const result = await apiService.analyzeFile(file);
      clearInterval(stepInterval);

      if (result.success) {
        setStatus('success');
        onAnalysisComplete(result, file);
      } else {
        throw new Error(result.error || 'Neural analysis returned an unsuccessful signal.');
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Connection interrupted. Ensure the FastAPI backend is running on http://localhost:8000.';
      setErrorMessage(message);
      setStatus('error');
      onAnalysisError(message);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div id="upload-portal" className="w-full max-w-3xl mx-auto scroll-mt-24">
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative glass-panel rounded-2xl p-6 sm:p-10 transition-all duration-500 overflow-hidden hud-corners border ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_35px_rgba(34,211,238,0.25)]'
            : status === 'analyzing'
            ? 'border-violet-500/60 bg-violet-950/15 shadow-[0_0_40px_rgba(139,92,246,0.2)]'
            : status === 'error'
            ? 'border-rose-500/50 bg-rose-950/10'
            : 'border-white/10 hover:border-violet-500/40 bg-[#0D1120]/80'
        }`}
      >
        {/* Holographic Laser Scan Line Animation during drag or analyzing */}
        {(isDragOver || status === 'analyzing') && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanbeam pointer-events-none z-20 shadow-[0_0_15px_#22D3EE]" />
        )}

        <div className="flex flex-col items-center text-center">
          {/* Status Icon */}
          <div className="relative mb-6">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                status === 'idle'
                  ? 'bg-violet-600/10 text-violet-400 border-violet-500/30'
                  : status === 'analyzing'
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                  : status === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-rose-500/15 text-rose-400 border-rose-400/50 shadow-[0_0_20px_rgba(251,113,133,0.3)]'
              }`}
            >
              {status === 'idle' && <Upload size={28} className="animate-bounce" />}
              {status === 'analyzing' && <Loader2 size={28} className="animate-spin text-cyan-400" />}
              {status === 'success' && <CheckCircle2 size={28} />}
              {status === 'error' && <AlertTriangle size={28} />}
            </div>

            {status === 'analyzing' && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500" />
              </span>
            )}
          </div>

          {/* Heading and description */}
          <div className="space-y-2 mb-6 max-w-lg">
            <div className="font-mono text-[10px] tracking-widest text-violet-400 uppercase font-semibold">
              INGESTION PIPELINE // MULTI-MODAL VECTORIZER
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {status === 'idle' && (file ? 'Dataset Staged for Synthesis' : 'Deploy Customer Review Dataset')}
              {status === 'analyzing' && 'Synthesizing Neural Intelligence'}
              {status === 'success' && 'Analysis Synchronized'}
              {status === 'error' && 'Neural Synthesis Interrupted'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {status === 'idle' &&
                'Drag and drop any review CSV file or select from disk to generate real-time sentiment distribution, topic clusters, and strategic recommendations.'}
              {status === 'analyzing' && steps[analysisStep]}
              {status === 'success' &&
                'Your customer intelligence dashboard has been populated with real verified feedback analysis.'}
              {status === 'error' && errorMessage}
            </p>
          </div>

          {/* File Selected Card */}
          {file && status !== 'analyzing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md p-3.5 mb-6 rounded-xl bg-white/[0.04] border border-violet-500/30 flex items-center justify-between gap-4 font-mono text-xs"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                  <FileText size={18} />
                </div>
                <div className="text-left truncate">
                  <span className="block text-white font-medium truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-400">{formatFileSize(file.size)} · CSV Stream</span>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="px-2.5 py-1 text-[10px] rounded hover:bg-white/10 text-slate-400 hover:text-white uppercase transition-colors"
              >
                Change
              </button>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {status === 'idle' && !file && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] flex items-center gap-2"
                >
                  <Upload size={14} />
                  <span>Select CSV File</span>
                </button>

                <button
                  onClick={onLoadSample}
                  className="px-5 py-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-cyan-400" />
                  <span>Load Sample Benchmark</span>
                </button>
              </>
            )}

            {status === 'idle' && file && (
              <button
                onClick={startAnalysis}
                className="px-8 py-3.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center gap-2"
              >
                <Sparkles size={15} className="text-cyan-300" />
                <span>Initiate Neural Synthesis</span>
              </button>
            )}

            {status === 'error' && (
              <div className="flex gap-3">
                <button
                  onClick={() => setStatus('idle')}
                  className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <RefreshCw size={13} />
                  <span>Retry Upload</span>
                </button>
                <button
                  onClick={onLoadSample}
                  className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Use Sample Dataset
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Micro HUD Metadata */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] w-full flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500">
            <span>FORMAT: UTF-8 / ASCII CSV</span>
            <span>MAX PAYLOAD: 10 MB</span>
            <span>PARALLEL PIPELINES: 50-ROW CHUNKS</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
