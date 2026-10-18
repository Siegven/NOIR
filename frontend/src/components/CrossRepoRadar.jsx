import React from 'react';
import { Network, GitCompare, AlertTriangle, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';

export default function CrossRepoRadar({ analysisData, isAnalyzing }) {
  if (isAnalyzing) {
    return (
      <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
        <div className="w-24 h-24 rounded-full border-2 border-dashed border-noir-accent animate-spin relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-noir-emerald animate-ping opacity-75" />
          <Network className="w-8 h-8 text-white absolute" />
        </div>
        <h3 className="text-lg font-bold text-white mt-6">NOIR Structural RAG in Progress</h3>
        <p className="text-xs text-slate-400 mt-2 font-mono text-center max-w-md">
          Extracting AST signatures • Vectorizing architecture profile • Searching public GitHub peer repositories...
        </p>
      </div>
    );
  }

  const {
    repository = "sample_buggy_repo/patient_queue",
    primary_language = "Python",
    architecture_patterns = ["background-jobs", "api-routes", "security-risk"],
    matched_peer_repos = [
      {
        repo_id: "Netflix/conductor",
        similarity_score: 89.2,
        structural_similarity: 91.5,
        shared_patterns: ["background-jobs", "worker-queue"],
        insight: "Top queue repos implement thread-safe worker pools and redis backoff retry limits."
      },
      {
        repo_id: "celery/celery",
        similarity_score: 84.7,
        structural_similarity: 86.0,
        shared_patterns: ["task-queue", "priority-routing"],
        insight: "Highly rated repos avoid mutable global lists; replace with isolated FIFO queues."
      }
    ],
    detected_flaws = [
      { type: "CRITICAL", title: "Unsafe eval(command)", detail: "Remote code execution hazard detected in priority calculator." },
      { type: "FATAL", title: "ZeroDivisionError", detail: "100 / len(queue) will crash when queue is initially empty." },
      { type: "WARNING", title: "Hardcoded Credential", detail: "SECRET_KEY = 'admin-123' found in root file scope." }
    ]
  } = analysisData || {};

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-5 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Network className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">Cross-Repository Intelligence Radar</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target: <span className="font-mono text-white font-medium">{repository}</span> • Language: <span className="font-mono text-indigo-300">{primary_language}</span>
          </p>
        </div>

        {/* Architecture pattern badges */}
        <div className="flex flex-wrap gap-1.5">
          {architecture_patterns.map((pat, i) => (
            <span
              key={i}
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                pat.includes("security")
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              }`}
            >
              #{pat}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Peer Repositories Discovered */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5 text-noir-accent" />
              Retrieved Open-Source Peer Benchmarks
            </span>
            <span className="text-[10px] font-mono text-slate-400">Vector Cosine Match</span>
          </div>

          <div className="space-y-3">
            {matched_peer_repos.map((peer, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-noir-900/80 border border-white/5 hover:border-noir-accent/40 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-white hover:text-indigo-400 transition-colors">
                      {peer.repo_id}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">{peer.similarity_score}% Match</span>
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                        style={{ width: `${peer.similarity_score}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/5 font-sans">
                  💡 <span className="font-semibold text-white">Architectural Directive:</span> {peer.insight}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Detected Vulnerabilities & Gaps */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-xs font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Detected Architectural Vulnerabilities
          </span>

          <div className="space-y-2.5">
            {detected_flaws.map((flaw, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-noir-900/60 border border-white/5 flex items-start space-x-3"
              >
                <div className="mt-0.5">
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      flaw.type === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : flaw.type === "FATAL"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {flaw.type}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{flaw.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{flaw.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

