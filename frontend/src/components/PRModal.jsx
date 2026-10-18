import React, { useState, useEffect } from 'react';
import { GitPullRequest, CheckCircle2, Loader2, ExternalLink, X, ShieldCheck } from 'lucide-react';

export default function PRModal({ isOpen, onClose, repoName = "sample_buggy_repo" }) {
  const [step, setStep] = useState(1);
  const [branchName, setBranchName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const randomHash = Math.random().toString(36).substring(2, 8);
      setBranchName(`noir-fixes-${randomHash}`);

      const timer1 = setTimeout(() => setStep(2), 1200);
      const timer2 = setTimeout(() => setStep(3), 2500);
      const timer3 = setTimeout(() => setStep(4), 3800);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel-glow w-full max-w-lg rounded-2xl p-6 border border-white/15 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 font-bold">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Autonomous Pull Request Pipeline</h3>
            <p className="text-xs text-slate-400">Target: <span className="font-mono text-indigo-300">{repoName}</span></p>
          </div>
        </div>

        {/* Multi-step progress list */}
        <div className="space-y-3.5 my-6">
          {/* Step 1 */}
          <div className="flex items-center space-x-3 text-xs">
            {step > 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
            )}
            <span className={step >= 1 ? "text-slate-200 font-medium" : "text-slate-500"}>
              Creating isolated branch <span className="font-mono text-indigo-300">refs/heads/{branchName}</span>
            </span>
          </div>

          {/* Step 2 */}
          <div className="flex items-center space-x-3 text-xs">
            {step > 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : step === 2 ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
            )}
            <span className={step >= 2 ? "text-slate-200 font-medium" : "text-slate-500"}>
              Staging fine-tuned refactored code without conversational fluff
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex items-center space-x-3 text-xs">
            {step > 3 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : step === 3 ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
            )}
            <span className={step >= 3 ? "text-slate-200 font-medium" : "text-slate-500"}>
              Verifying syntax integrity and commit signature
            </span>
          </div>

          {/* Step 4 */}
          <div className="flex items-center space-x-3 text-xs">
            {step >= 4 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
            )}
            <span className={step >= 4 ? "text-emerald-300 font-bold" : "text-slate-500"}>
              Pull Request successfully opened on GitHub!
            </span>
          </div>
        </div>

        {/* PR Success Card */}
        {step >= 4 && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Pull Request #1 Active
              </span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                Branch: {branchName}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              NOIR has submitted code refactors resolving <code className="text-rose-300">eval()</code> security flaw, handling <code className="text-amber-300">ZeroDivisionError</code>, and applying cross-repo queue best practices.
            </p>
            <a
              href={`https://github.com`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              <span>Review on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

