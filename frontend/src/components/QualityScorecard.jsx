import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Layers, 
  Check, 
  BookOpen, 
  Activity,
  FileCode2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function QualityScorecard({ qualityReport, isLoading, onRefresh }) {
  if (isLoading) {
    return (
      <div className="p-8 rounded-2xl bg-[#0B0F17] border border-white/[0.08] flex items-center justify-center space-x-3">
        <Activity className="w-5 h-5 text-indigo-400 animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Computing repository quality and security metrics...</span>
      </div>
    );
  }

  if (!qualityReport) return null;

  const { overall_score, grade, badge_status, parameters, stats, detected_issues } = qualityReport;

  // Compute SVG circle stroke offset for circular gauge
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall_score / 100) * circumference;

  const getGradeColor = (g) => {
    if (g.startsWith("A")) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (g === "B") return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    if (g === "C") return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 65) return "#38bdf8";
    if (score >= 50) return "#f59e0b";
    return "#f43f5e";
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0B0F17] border border-white/[0.08] space-y-6 shadow-xl">
      {/* Top Header & Circular Score Gauge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-center space-x-5">
          {/* Circular Score Gauge */}
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-white/10"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={getScoreColor(overall_score)}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono text-white leading-none">
                {overall_score}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                /100
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Repository Health Index
              </span>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${getGradeColor(grade)}`}>
                Grade {grade}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              {badge_status}
            </h3>
            <p className="text-xs text-slate-400">
              Audited {stats?.code_files || 0} code files across {stats?.total_lines || 0} total lines.
            </p>
          </div>
        </div>

        {/* Actions & Quick Stats Pill */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-xs font-mono text-indigo-300 hover:text-white flex items-center space-x-1.5 transition-all shadow-sm"
              title="Pull latest merged commits from GitHub and recalculate quality score"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Check Merge & Re-Score</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[9px] uppercase font-mono text-slate-400 block">Tests</span>
              <span className={`text-[11px] font-bold font-mono ${stats?.has_tests ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats?.has_tests ? "Present" : "Missing"}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[9px] uppercase font-mono text-slate-400 block">CI/CD</span>
              <span className={`text-[11px] font-bold font-mono ${stats?.has_cicd ? 'text-emerald-400' : 'text-slate-400'}`}>
                {stats?.has_cicd ? "Configured" : "None"}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-[9px] uppercase font-mono text-slate-400 block">Issues</span>
              <span className={`text-[11px] font-bold font-mono ${(detected_issues?.length || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {detected_issues?.length || 0} Found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Dimension Parameter Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
          Architecture & Quality Parameters
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {parameters?.map((param, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{param.name}</span>
                <span className="font-mono font-bold" style={{ color: param.color }}>
                  {param.score}%
                </span>
              </div>
              
              {/* Progress Track */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${param.score}%`,
                    backgroundColor: param.color
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {param.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detected Code Issues (if any) */}
      {detected_issues && detected_issues.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Detected Architecture Gaps ({detected_issues.length})
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">Autonomous NOIR Repair Available</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {detected_issues.map((iss, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-indigo-300 font-semibold">{iss.file}:{iss.line}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      iss.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      iss.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-500/20 text-slate-300'
                    }`}>
                      {iss.severity}
                    </span>
                    <span className="text-slate-400 text-[11px]">({iss.category})</span>
                  </div>
                  <p className="text-slate-300 text-xs">{iss.issue}</p>
                  <p className="text-[11px] text-emerald-400 font-mono">↳ Fix: {iss.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

