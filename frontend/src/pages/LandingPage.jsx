import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  GitPullRequest, 
  Layers, 
  Sparkles, 
  ExternalLink,
  Zap,
  Lock,
  Loader2
} from 'lucide-react';
import { API_BASE } from '../apiConfig';

const GitHubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function LandingPage({ onEnterApp, userToken, setUserToken, onLogout }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [manualToken, setManualToken] = useState("");

  const handleGitHubOAuth = async () => {
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/github/login`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          // Direct browser to GitHub's official authorization screen!
          window.location.href = data.url;
          return;
        }
      }
      // If GITHUB_CLIENT_ID isn't set in backend yet, open helpful setup guide
      setShowConfigHelp(true);
    } catch (err) {
      setShowConfigHelp(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      setUserToken(manualToken.trim());
      localStorage.setItem("noir_github_token", manualToken.trim());
      setShowConfigHelp(false);
      onEnterApp();
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-white/[0.08] backdrop-blur-md bg-[#07090E]/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-mono font-black text-slate-950 text-base shadow-lg shadow-indigo-500/20">
              N
            </div>
            <span className="font-mono font-extrabold tracking-wider text-white text-lg">NOIR</span>
          </div>

          <div className="flex items-center space-x-4">
            {userToken ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  GitHub Connected
                </span>
                <button
                  onClick={onLogout || (() => {
                    setUserToken('');
                    localStorage.removeItem('noir_github_token');
                    localStorage.removeItem('noir_github_profile');
                  })}
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 transition-all text-xs font-medium"
                  title="Log out of GitHub"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={handleGitHubOAuth}
                disabled={isLoggingIn}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition-all flex items-center space-x-2"
              >
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitHubIcon className="w-4 h-4" />}
                <span>Sign in with GitHub</span>
              </button>
            )}

            <button
              onClick={onEnterApp}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center space-x-1.5"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-indigo-300 font-mono mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Generation Autonomous Code Refactoring</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
          Code repair powered by real open-source benchmarks.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          NOIR fingerprints your repository’s architecture, discovers peer implementations on GitHub, and autonomously writes Pull Requests to elevate your codebase.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleGitHubOAuth}
            disabled={isLoggingIn}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center space-x-2.5 shadow-xl shadow-white/10"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <GitHubIcon className="w-4 h-4" />}
            <span>Sign in with GitHub</span>
          </button>

          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Structural Fingerprinting</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Extracts AST symbols, directory hierarchies, and architectural patterns like caching, queues, and gateways.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Cross-Repo Intelligence</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Compares your repo against highly-starred GitHub peers using vector search to detect missing patterns.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Autonomous Pull Requests</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              NOIR writes clean replacement code, creates an isolated branch, and opens a GitHub PR automatically.
            </p>
          </div>
        </div>
      </section>

      {/* GitHub OAuth Setup / Manual Token Modal */}
      {showConfigHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-[#0D111A] border border-white/15 shadow-2xl relative space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                <GitHubIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">GitHub OAuth Not Configured Yet</h3>
                <p className="text-xs text-slate-400">Add your OAuth App keys in backend, or enter a Personal Token below.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 space-y-1.5 font-mono">
              <div className="font-bold text-white">To enable 1-Click OAuth:</div>
              <div>1. Register an app at: github.com/settings/applications/new</div>
              <div>2. Callback URL: http://localhost:8000/api/auth/github/callback</div>
              <div>3. Add GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET to backend/.env</div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
              <label className="block text-xs font-mono text-slate-300">
                Or enter a Personal Access Token for now:
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigHelp(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
                >
                  Save & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-slate-400 font-mono">
        NOIR Autonomous Code Repair Studio • Built with Fine-Tuned Qwen 2.5 Coder
      </footer>
    </div>
  );
}
