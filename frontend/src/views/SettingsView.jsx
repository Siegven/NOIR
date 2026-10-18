import React, { useState } from 'react';
import { Settings, Key, Cpu, CheckCircle2, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';

export default function SettingsView({ userToken, setUserToken }) {
  const [token, setToken] = useState(userToken || "");
  const [isSaved, setIsSaved] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleSaveToken = (e) => {
    e.preventDefault();
    setUserToken(token.trim());
    localStorage.setItem("noir_github_token", token.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setHealthStatus(data);
      } else {
        setHealthStatus({ status: "offline", error: `HTTP ${res.status}` });
      }
    } catch (err) {
      setHealthStatus({ status: "offline", error: "Backend server not responding on port 8000" });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="pb-4 border-b border-white/[0.08]">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Settings & Environment Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure your GitHub connection, Ollama backend model, and verify server telemetry.
        </p>
      </div>

      {/* GitHub Token Card */}
      <div className="p-6 rounded-2xl bg-[#0B0F17] border border-white/[0.08] space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">GitHub Personal Access Token</h3>
            <p className="text-xs text-slate-400">Used by the backend to fetch your real repos and open Pull Requests.</p>
          </div>
        </div>

        <form onSubmit={handleSaveToken} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span>Token is stored securely in your browser's LocalStorage.</span>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=NOIR+Engine"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Generate new token on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
            >
              {isSaved ? "Saved!" : "Save Token"}
            </button>
            {isSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Token updated successfully!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Backend Engine Status Card */}
      <div className="p-6 rounded-2xl bg-[#0B0F17] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">NOIR Backend & Ollama Telemetry</h3>
              <p className="text-xs text-slate-400">Health check connection to FastAPI and Ollama engine.</p>
            </div>
          </div>

          <button
            onClick={checkHealth}
            disabled={isChecking}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {healthStatus && (
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <span className={healthStatus.status === "online" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {healthStatus.status.toUpperCase()}
              </span>
            </div>
            {healthStatus.model && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Model:</span>
                <span className="text-white">{healthStatus.model}</span>
              </div>
            )}
            {healthStatus.github_token_configured !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Backend GitHub Token:</span>
                <span className={healthStatus.github_token_configured ? "text-emerald-400" : "text-amber-400"}>
                  {healthStatus.github_token_configured ? "Configured in .env" : "Not Set"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

