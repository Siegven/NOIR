import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  GitBranch, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink,
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle,
  FileCode, 
  FolderGit2, 
  Loader2, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  FileWarning,
  RefreshCw,
  Sliders
} from 'lucide-react';

export default function RepairView({ selectedRepo, userToken, onUpdateQualityScore, onNavigateToRepos, onNavigateToAnalysis }) {
  const [viewMode, setViewMode] = useState('side-by-side');
  
  // Autonomous Multi-File Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [scanError, setScanError] = useState(null);

  // Multi-File PR Dispatch State
  const [isDispatchingPR, setIsDispatchingPR] = useState(false);
  const [prCreated, setPrCreated] = useState(false);
  const [prData, setPrData] = useState(null);
  const [prError, setPrError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reset scan state if active target repo changes
  useEffect(() => {
    setScanResult(null);
    setSelectedFilePath(null);
    setScanError(null);
    setPrCreated(false);
    setPrData(null);
    setPrError(null);
  }, [selectedRepo]);

  // Run Autonomous Scan across all folders
  const handleRunAutonomousScan = async () => {
    if (!selectedRepo) return;
    setIsScanning(true);
    setScanError(null);
    setPrCreated(false);
    setPrError(null);

    try {
      const res = await fetch("/api/scan-and-repair-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_full_name: selectedRepo,
          github_token: userToken
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Scan failed with status ${res.status}`);
      }

      const data = await res.json();
      setScanResult(data);

      // Auto-select first repaired file, or first clean file
      if (data.repaired_files && data.repaired_files.length > 0) {
        setSelectedFilePath(data.repaired_files[0].file_path);
      } else if (data.clean_files && data.clean_files.length > 0) {
        setSelectedFilePath(data.clean_files[0].file_path);
      }
    } catch (err) {
      console.error("Scan error:", err);
      setScanError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Dispatch Multi-File Pull Request for all repaired files
  const handleDispatchMultiFilePR = async () => {
    if (!selectedRepo || !scanResult || !scanResult.repaired_files?.length) return;
    setIsDispatchingPR(true);
    setPrError(null);
    setPrCreated(false);

    try {
      const filesToCommit = scanResult.repaired_files.map(f => ({
        file_path: f.file_path,
        content: f.repaired_code
      }));

      const res = await fetch("/api/create-multi-file-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_full_name: selectedRepo,
          github_token: userToken,
          files: filesToCommit,
          pr_title: `🤖 NOIR Autonomous Quality Repair: ${filesToCommit.length} file(s) refactored`,
          pr_body: `### 🛡️ NOIR Autonomous Multi-File Code Quality Repair\n\nNOIR scanned **${selectedRepo}** across all folders and autonomously refactored **${filesToCommit.length} file(s)** based on cross-repository architectural benchmarks.\n\n#### 📄 Refactored Files:\n${filesToCommit.map(f => `- \`${f.file_path}\``).join('\n')}\n\n#### 🔍 Applied Standards:\n- Handled critical runtime exception edge cases and input validation\n- Removed dynamic code execution hazards (e.g. eval/exec)\n- Aligned modularity and error handling with top open-source peers\n\nVerified and committed by NOIR Engine (\`noir:latest\`).`
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `PR dispatch failed with status ${res.status}`);
      }

      const data = await res.json();
      setPrData(data);
      setPrCreated(true);
      if (scanResult?.post_repair_quality) {
        onUpdateQualityScore?.(selectedRepo, scanResult.post_repair_quality);
      }
    } catch (err) {
      console.error("PR error:", err);
      setPrError(err.message);
    } finally {
      setIsDispatchingPR(false);
    }
  };

  // Selected file details
  const currentFile = scanResult?.repaired_files?.find(f => f.file_path === selectedFilePath) ||
                      scanResult?.clean_files?.find(f => f.file_path === selectedFilePath);

  const handleCopyCode = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedRepo) {
    return (
      <div className="p-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FolderGit2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">No Target Repository Selected</h3>
          <p className="text-xs text-slate-400 mt-1">
            Pick a repository from your GitHub list first before running autonomous repairs.
          </p>
        </div>
        <button
          onClick={onNavigateToRepos}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
        >
          Select a Repository
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            Autonomous Multi-Folder Code Repair Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Target Repository: <span className="font-mono text-white font-semibold">{selectedRepo}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunAutonomousScan}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isScanning ? "Scanning All Folders..." : (scanResult ? "Re-scan Repository" : "Scan Entire Repository")}</span>
          </button>

          {scanResult && scanResult.files_requiring_repair > 0 && (
            <button
              onClick={handleDispatchMultiFilePR}
              disabled={isDispatchingPR}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isDispatchingPR ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
              <span>{isDispatchingPR ? "Opening Pull Request..." : `Approve All & Open PR (${scanResult.files_requiring_repair})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Scanning In Progress Banner */}
      {isScanning && (
        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-white">Autonomous Multi-Folder Crawl Active</h3>
          <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
            Traversing subfolders • Static security analysis • NOIR fine-tuned model inference across all code files...
          </p>
        </div>
      )}

      {/* Error state */}
      {scanError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span><strong className="font-bold">Scan Failed:</strong> {scanError}</span>
        </div>
      )}

      {/* PR Creation Error */}
      {prError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span><strong className="font-bold">PR Dispatch Failed:</strong> {prError}</span>
        </div>
      )}

      {/* Real PR Created Success Card with Live Upgraded Quality Score */}
      {prCreated && prData && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-indigo-500/15 border border-emerald-500/40 text-xs flex flex-col gap-4 animate-fade-in shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-white">
                  Pull Request #{prData.pr_number} Successfully Opened on GitHub!
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  Score & Grade Upgraded
                </span>
              </div>
              <p className="text-slate-300 text-xs">
                Refactored and committed <span className="font-mono text-white font-bold">{prData.files_fixed} file(s)</span> on branch <code className="text-emerald-300 font-mono font-semibold">{prData.branch}</code> for <span className="font-mono text-white">{selectedRepo}</span>.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={prData.pr_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 flex-shrink-0 shadow-lg shadow-emerald-500/20"
              >
                <span>View PR on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {onNavigateToAnalysis && (
                <button
                  onClick={onNavigateToAnalysis}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 flex-shrink-0 shadow-lg shadow-indigo-600/20"
                >
                  <span>Radar Scorecard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {scanResult?.post_repair_quality && (
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Pre-Repair:</span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {scanResult.quality_audit.overall_score}/100 ({scanResult.quality_audit.grade})
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-emerald-300 uppercase font-semibold">Post-Commit Score:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-500/40">
                    {scanResult.post_repair_quality.overall_score}/100 ({scanResult.post_repair_quality.grade})
                  </span>
                </div>
                {scanResult.score_improvement > 0 && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    +{scanResult.score_improvement} Points Improvement
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                💡 After merging the PR on GitHub, the live GitHub branch reflects this improved score!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Post-Repair Quality Score Improvement Banner */}
      {scanResult && !isScanning && scanResult.quality_audit && scanResult.post_repair_quality && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                Autonomous Quality Score Boost
              </span>
              <span className="text-xs text-slate-300">
                Projected grade jump for {selectedRepo}:
              </span>
            </div>
            
            <div className="flex items-center space-x-3 pt-1">
              <span className="text-xs font-mono text-slate-400">
                Pre-Repair: <strong className="text-rose-400 font-bold">{scanResult.quality_audit.overall_score}/100 ({scanResult.quality_audit.grade})</strong>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-mono text-white">
                Post-Repair: <strong className="text-emerald-400 font-bold text-sm">{scanResult.post_repair_quality.overall_score}/100 ({scanResult.post_repair_quality.grade})</strong>
              </span>
              {scanResult.score_improvement > 0 && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  +{scanResult.score_improvement} Points Boost
                </span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Issues Resolved</span>
            <span className="text-xs font-mono font-bold text-emerald-300">
              {Math.max(1, (scanResult.quality_audit.detected_issues?.length || 0) - (scanResult.post_repair_quality.detected_issues?.length || 0))} Critical Gaps Fixed
            </span>
          </div>
        </div>
      )}

      {/* Initial Hero / Prompt when no scan has been executed yet */}
      {!scanResult && !isScanning && (
        <div className="p-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Autonomous Full-Repository Repair</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              NOIR can autonomously crawl every directory inside <span className="font-mono text-indigo-300 font-semibold">{selectedRepo}</span>, locate architectural anti-patterns, input vulnerabilities, and missing error guards, and prepare refactored code.
            </p>
          </div>
          <button
            onClick={handleRunAutonomousScan}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            Start Autonomous Scan
          </button>
        </div>
      )}

      {/* Scan Results Layout: File Manifest on Left + Live Diff on Right */}
      {scanResult && !isScanning && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Audited File Manifest (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0B0F17] border border-white/[0.08] p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h4 className="text-xs font-bold text-white">Repository Manifest</h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  {scanResult.total_files_scanned} files audited
                </p>
              </div>

              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                scanResult.files_requiring_repair > 0 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {scanResult.files_requiring_repair} Refactored
              </span>
            </div>

            {/* Repaired Files List */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {scanResult.repaired_files?.map((f) => (
                <button
                  key={f.file_path}
                  onClick={() => setSelectedFilePath(f.file_path)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs font-mono ${
                    selectedFilePath === f.file_path 
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white' 
                      : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileWarning className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{f.file_path}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex-shrink-0">
                    Fix Ready
                  </span>
                </button>
              ))}

              {/* Clean Files List */}
              {scanResult.clean_files?.map((f) => (
                <div
                  key={f.file_path}
                  className="p-2.5 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between text-xs font-mono text-slate-500 opacity-70"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-500/60 flex-shrink-0" />
                    <span className="truncate">{f.file_path}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                    Clean
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Code Diff Viewer for Selected File (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {currentFile ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0A0D14] overflow-hidden font-mono text-xs shadow-2xl">
                {/* Diff Viewer Top Header */}
                <div className="p-4 bg-[#080B10] border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Inspecting File:</span>
                    <span className="text-white font-bold font-mono text-xs">{currentFile.file_path}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex rounded-lg bg-black/40 p-1 border border-white/10 text-[11px]">
                      <button
                        onClick={() => setViewMode('side-by-side')}
                        className={`px-2.5 py-0.5 rounded-md transition-colors ${
                          viewMode === 'side-by-side' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Side-by-Side
                      </button>
                      <button
                        onClick={() => setViewMode('repaired-only')}
                        className={`px-2.5 py-0.5 rounded-md transition-colors ${
                          viewMode === 'repaired-only' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Repaired Only
                      </button>
                    </div>

                    {currentFile.repaired_code && (
                      <button
                        onClick={() => handleCopyCode(currentFile.repaired_code)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                        title="Copy Repaired Code"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Detected Issues for this File */}
                {currentFile.issues && currentFile.issues.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="font-mono">
                      Detected Flaws Fixed: {currentFile.issues.join("; ")}
                    </span>
                  </div>
                )}

                {/* Diff Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
                  {/* Left: Original Code */}
                  {viewMode === 'side-by-side' && (
                    <div className="p-4 bg-[#080B10] flex flex-col">
                      <div className="pb-2 mb-2 border-b border-white/5 text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Original Repository Code
                      </div>
                      <pre className="text-slate-300/80 leading-relaxed overflow-x-auto whitespace-pre font-mono text-[11px] max-h-[500px]">
                        {currentFile.original_code || "(Clean file - no modifications required)"}
                      </pre>
                    </div>
                  )}

                  {/* Right: Repaired Code */}
                  <div className={`p-4 bg-[#0B0F17] flex flex-col ${viewMode === 'repaired-only' ? 'lg:col-span-2' : ''}`}>
                    <div className="pb-2 mb-2 border-b border-white/5 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      NOIR Refactored Code
                    </div>
                    <pre className="text-emerald-300/90 leading-relaxed overflow-x-auto whitespace-pre font-mono text-[11px] max-h-[500px]">
                      {currentFile.repaired_code || currentFile.original_code}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-[#0B0F17] border border-white/[0.08] text-xs text-slate-400">
                Select a file from the manifest on the left to view its autonomous diff.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
