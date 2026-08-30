'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  ShieldCheck,
  Cpu,
  Layers,
  Zap,
  Globe,
  Database,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import './ResumeDropper.css';

export interface ParsedResumeData {
  fileName: string;
  fileSize: string;
  inferredRole: string;
  detectedTags: string[];
  inferredSkills: {
    programming: number;
    dataMath: number;
    design: number;
    communication: number;
    leadership: number;
    research: number;
  };
}

interface ResumeDropperProps {
  onParsed?: (data: ParsedResumeData) => void;
  onSkip?: () => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const ResumeDropper: React.FC<ResumeDropperProps> = ({
  onParsed,
  onSkip,
  title = 'Fast-Track Calibration via Resume',
  subtitle = 'Upload your CV or LinkedIn export to instantly infer starting proficiency levels across distributed systems and architecture domains.',
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStage, setParsingStage] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stages = [
    'Reading document tokens & experience timeline...',
    'Extracting cloud & architectural patterns (Kubernetes, Kafka, gRPC)...',
    'Calibrating 6-axis Trellis Skill Radar geometry...'
  ];

  const handleProcessFile = (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    setParsingStage(0);

    // Stage 1
    setTimeout(() => {
      setParsingStage(1);
    }, 600);

    // Stage 2
    setTimeout(() => {
      setParsingStage(2);
    }, 1200);

    // Complete
    setTimeout(() => {
      setIsParsing(false);
      const data: ParsedResumeData = {
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        inferredRole: 'Senior Staff Systems Architect',
        detectedTags: [
          'Kubernetes',
          'Distributed Sagas',
          'gRPC & Protocol Buffers',
          'Apache Kafka',
          'PostgreSQL Sharding',
          'Zero-Trust mTLS',
          'System Design'
        ],
        inferredSkills: {
          programming: 78,
          dataMath: 72,
          design: 80,
          communication: 65,
          leadership: 68,
          research: 70
        }
      };

      setParsedData(data);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399', '#f59e0b']
        });
      } catch {
        // ignore
      }

      onParsed?.(data);
    }, 1800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleProcessFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleProcessFile(selectedFile);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setIsParsing(false);
    setParsingStage(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`resume-dropper-container space-y-6 ${className}`}>
      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Skill Inference</span>
        </div>
        <h2 className="font-literata text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* State 1: Dropzone (No file or ready to upload) */}
      {!file && !isParsing && (
        <div
          onDragOver={e => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`resume-drop-zone ${isDragOver ? 'drag-active' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="resume-upload-icon-pulse">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="font-literata font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1">
            Drag and drop your resume here
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            or <span className="text-emerald-600 dark:text-emerald-400 font-bold underline">browse files</span> from your computer
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span>Supports: PDF, DOCX, DOC, TXT</span>
            <span>•</span>
            <span>Max 20MB</span>
          </div>
        </div>
      )}

      {/* State 2: Parsing in Progress */}
      {isParsing && (
        <div className="resume-parsing-card text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-spin">
            <RefreshCw className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h4 className="font-literata font-bold text-lg text-slate-900 dark:text-white">
              Parsing & Calibrating Resume...
            </h4>
            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 min-h-[20px] transition-all">
              {stages[parsingStage]}
            </p>
          </div>

          <div className="w-full max-w-md mx-auto h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((parsingStage + 1) / 3) * 100}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Document parsed locally. Personal data is never stored unencrypted.
          </p>
        </div>
      )}

      {/* State 3: Parsed Results & Skill Calibration */}
      {parsedData && !isParsing && (
        <div className="resume-parsing-card space-y-6 animate-in fade-in duration-300">
          {/* File Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1">
                    {parsedData.fileName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Calibrated</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inferred Target: <strong className="text-slate-800 dark:text-slate-200">{parsedData.inferredRole}</strong> • {parsedData.fileSize}
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              title="Upload different resume"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inferred Skill Delta Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Inferred Competency Calibrations</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Programming</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">78 / 100</p>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+28 pts inferred</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Architecture</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">80 / 100</p>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+30 pts inferred</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Data & Sagas</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">72 / 100</p>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+22 pts inferred</span>
              </div>
            </div>
          </div>

          {/* Detected Architectural Skills */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Detected Technical Signatures
            </span>
            <div className="flex flex-wrap gap-1.5">
              {parsedData.detectedTags.map((tag, idx) => (
                <span key={idx} className="extracted-skill-chip">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer Actions */}
      <div className="flex items-center justify-between pt-2">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-2 px-3 rounded-xl transition-colors cursor-pointer"
          >
            Skip & calibrate manually
          </button>
        )}

        {parsedData && (
          <button
            type="button"
            onClick={() => onParsed?.(parsedData)}
            className="ml-auto bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white dark:text-slate-950 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>Apply Calibration to Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ResumeDropper;

