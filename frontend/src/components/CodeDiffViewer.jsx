import React, { useState } from 'react';
import { Code2, Sparkles, Check, Copy, ArrowRight, ShieldCheck, GitBranch } from 'lucide-react';

export default function CodeDiffViewer({ originalCode, repairedCode, onTriggerPR, isProcessingPR }) {
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'repaired-only'
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(repairedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const defaultOriginal = `import os, json, sys

SECRET_KEY = "admin-123"  # ⚠️ Flaw 1: Hardcoded secret

def calculate_priority(patient, queue, command=None):
    if patient != None:
        if "name" in patient:
            if "severity" in patient:
                if patient["severity"] == "critical":
                    score = 100
                else:
                    if patient["severity"] == "high":
                        score = 75
                    else:
                        if patient["severity"] == "medium":
                            score = 50
                        else:
                            score = 20
                if command:
                    result = eval(command)  # ⚠️ Flaw 2: Arbitrary remote code execution!
                    print(result)
                wait_factor = 100 / len(queue)  # ⚠️ Flaw 3: Crashes with ZeroDivisionError if queue is empty
                return score + wait_factor
            else:
                return "missing severity"
        else:
            return "missing name"
    else:
        return None

def add_patient(queue, patient):
    queue.append(patient)
    return queue`;

  const defaultRepaired = `import os
import json
import sys
from typing import Dict, Any, List, Optional

# ✅ Fixed: Secret loaded from environment with fallback
SECRET_KEY = os.getenv("SECRET_KEY", "default-dev-key")

PRIORITY_MAP = {
    "critical": 100,
    "high": 75,
    "medium": 50
}

def calculate_priority(patient: Optional[Dict[str, Any]], queue: List[Any]) -> Optional[float]:
    """
    Calculates prioritized queue rank using guard clauses and safe division.
    Enforces cross-repo security practices (eval removed, ZeroDivisionError protected).
    """
    # Guard clauses for early exit
    if not patient or "name" not in patient or "severity" not in patient:
        return None

    severity = patient.get("severity", "").lower()
    score = PRIORITY_MAP.get(severity, 20)

    # Safe wait factor calculation avoiding ZeroDivisionError
    wait_factor = (100.0 / len(queue)) if len(queue) > 0 else 0.0
    return score + wait_factor

def add_patient(queue: List[Any], patient: Dict[str, Any]) -> List[Any]:
    """Appends patient and preserves queue state."""
    if patient:
        queue.append(patient)
    return queue`;

  const codeA = originalCode || defaultOriginal;
  const codeB = repairedCode || defaultRepaired;

  return (
    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden my-6">
      {/* Header bar */}
      <div className="p-4 bg-noir-900/90 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-noir-accent/20 border border-noir-accent/30 text-indigo-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-white">sample_buggy_repo/patient_queue.py</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                NOIR Refactored
              </span>
            </div>
            <p className="text-[11px] text-slate-400">3 Security & Runtime Flaws Automatically Resolved</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <div className="flex rounded-lg bg-noir-950 p-1 border border-white/10 text-xs font-mono">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'side-by-side' ? 'bg-noir-accent text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('repaired-only')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'repaired-only' ? 'bg-noir-accent text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Repaired Only
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-noir-900 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors text-xs flex items-center gap-1.5"
            title="Copy Repaired Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onTriggerPR}
            disabled={isProcessingPR}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-50"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>{isProcessingPR ? "Creating PR..." : "Open Autonomous Pull Request"}</span>
          </button>
        </div>
      </div>

      {/* Code Window */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10 font-mono text-xs overflow-x-auto">
        {/* Left: Original Code */}
        {viewMode === 'side-by-side' && (
          <div className="bg-noir-950/60 p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5">
              <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Baseline (Buggy Code)
              </span>
              <span className="text-[10px] text-slate-400">Radon Score: 41.2 (Failing)</span>
            </div>
            <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
              {codeA}
            </pre>
          </div>
        )}

        {/* Right: NOIR Repaired Code */}
        <div className={`bg-noir-950/90 p-4 ${viewMode === 'repaired-only' ? 'lg:col-span-2' : ''}`}>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              NOIR Repaired (Fine-Tuned Qwen Output)
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Radon Score: 88.5 (+47.3 Boost)
            </span>
          </div>
          <pre className="text-emerald-300/90 leading-relaxed overflow-x-auto whitespace-pre">
            {codeB}
          </pre>
        </div>
      </div>
    </div>
  );
}

