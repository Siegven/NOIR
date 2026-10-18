import React, { useState, useEffect } from 'react';
import { 
  Network, 
  GitCompare, 
  AlertTriangle, 
  ExternalLink, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  ShieldAlert, 
  FolderGit2,
  Activity
} from 'lucide-react';
import QualityScorecard from '../components/QualityScorecard';

export default function AnalysisView({ selectedRepo, userToken, initialQualityReport, onUpdateQualityScore, onNavigateToRepair, onNavigateToRepos }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [qualityReport, setQualityReport] = useState(initialQualityReport || null);
  const [isLoadingQuality, setIsLoadingQuality] = useState(false);
  const [error, setError] = useState(null);

  // Sync initial quality report if provided
  useEffect(() => {
    if (initialQualityReport) {
      setQualityReport(initialQualityReport);
    }
  }, [initialQualityReport]);

  // Fetch Quality Report with cache-busting
  const fetchQualityReport = async () => {
    if (!selectedRepo) return;
    setIsLoadingQuality(true);
    try {
      const url = `/api/repo-quality?repo_full_name=${encodeURIComponent(selectedRepo)}${userToken ? `&token=${encodeURIComponent(userToken)}` : ''}&_t=${Date.now()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQualityReport(data);
        onUpdateQualityScore?.(selectedRepo, data);
      }
    } catch (err) {
      console.warn("Quality report error:", err);
    } finally {
      setIsLoadingQuality(false);
    }
  };

  // Run Cross-Repo Radar Analysis (Guaranteed 100% fresh vector DB run)
  const runAnalysis = async () => {
    if (!selectedRepo) return;
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null); // Never show old results
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repo_full_name: selectedRepo,
          github_token: userToken
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (selectedRepo) {
      // Clear previous repo's matches to guarantee 0 cross-pollination
      setAnalysisResult(null);
      setError(null);
      fetchQualityReport();
      runAnalysis();
    }
  }, [selectedRepo]);

  if (!selectedRepo) {
    return (
      <div className="p-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FolderGit2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">No Repository Selected</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Head to the Repositories tab, choose any repository from your GitHub account, and click "Audit" to inspect its architecture.
          </p>
        </div>
        <button
          onClick={onNavigateToRepos}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
        >
          Go to Repositories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            Cross-Repository Architectural Radar & Quality Audit
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Target: <span className="font-mono text-white font-semibold">{selectedRepo}</span>
          </p>
        </div>

        <button
          onClick={() => {
            fetchQualityReport();
            runAnalysis();
          }}
          disabled={isAnalyzing || isLoadingQuality}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {isAnalyzing || isLoadingQuality ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{isAnalyzing || isLoadingQuality ? "Auditing Repository..." : "Re-run Audit & Radar"}</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          <span className="font-bold">Analysis Failed:</span> {error}
        </div>
      )}

      {/* 1. Repository Initial Quality Scorecard (Visual Gauges & Metrics) */}
      <QualityScorecard
        qualityReport={qualityReport}
        isLoading={isLoadingQuality}
        onRefresh={fetchQualityReport}
      />

      {/* Loading state for Radar */}
      {isAnalyzing && (
        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-white">Harvesting Genuine Domain Peer Benchmarks</h3>
          <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
            Extracting semantic domain signatures • Querying public open-source projects • Computing cross-repo architectural delta...
          </p>
        </div>
      )}

      {/* 2. Real Analysis Results (Domain-Specific Peers) */}
      {analysisResult && !isAnalyzing && (
        <div className="space-y-6 animate-fade-in">
          {/* Target Profile Card */}
          <div className="p-5 rounded-2xl bg-[#0B0F17] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Target Profile</span>
              <h3 className="text-sm font-bold text-white font-mono">{analysisResult.repository}</h3>
              <p className="text-xs text-slate-400">
                Primary Language: <span className="text-indigo-300 font-mono font-bold">{analysisResult.primary_language || "Unknown"}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {analysisResult.architecture_patterns?.map((pat, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-md border bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                >
                  #{pat}
                </span>
              ))}
            </div>
          </div>

          {/* Matched Peer Repositories */}
          <div className="p-5 rounded-2xl bg-[#0B0F17] border border-white/[0.08] space-y-4">
            <div className="flex items-center space-x-2">
              <GitCompare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Retrieved Peer Open-Source Benchmarks (Domain Match)</h3>
            </div>

            {analysisResult.matched_peer_repos && analysisResult.matched_peer_repos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.matched_peer_repos.map((peer, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <a
                        href={`https://github.com/${peer.repo_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <span>{peer.repo_id}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {peer.similarity_score}% Match
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      💡 {peer.insight}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                No high-star catalog matches forced. Searching specialized peers for this domain...
              </div>
            )}
          </div>

          {/* Action to proceed to repair */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-indigo-300 font-medium">
              Ready to autonomously repair code with these architectural insights?
            </span>
            <button
              onClick={onNavigateToRepair}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
            >
              <span>Open Autonomous Repair Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
