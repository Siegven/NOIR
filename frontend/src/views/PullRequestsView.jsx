import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  ExternalLink, 
  RefreshCw, 
  Loader2, 
  GitBranch, 
  Clock, 
  User, 
  FolderGit2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { API_BASE } from '../apiConfig';

export default function PullRequestsView({ selectedRepo, userToken, onNavigateToRepos }) {
  const [pullRequests, setPullRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPRs = async () => {
    if (!selectedRepo) return;
    setIsLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/pull-requests?repo_full_name=${encodeURIComponent(selectedRepo)}${userToken ? `&token=${encodeURIComponent(userToken)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setPullRequests(data.pull_requests || []);
    } catch (err) {
      setError(err.message);
      setPullRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPRs();
  }, [selectedRepo, userToken]);

  if (!selectedRepo) {
    return (
      <div className="p-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FolderGit2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">No Repository Selected</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Please pick a repository from your GitHub list to inspect its Pull Requests.
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-indigo-400" />
            GitHub Pull Requests
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking branches and Pull Requests on <span className="font-mono text-white font-semibold">{selectedRepo}</span>
          </p>
        </div>

        <button
          onClick={fetchPRs}
          disabled={isLoading}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors text-xs flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto"
          title="Refresh Pull Requests"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Fetching Pull Requests from GitHub...</p>
        </div>
      )}

      {/* PR List */}
      {!isLoading && pullRequests.length > 0 && (
        <div className="space-y-3">
          {pullRequests.map((pr) => (
            <div
              key={pr.number}
              className="p-4 rounded-xl bg-[#0B0F17] border border-white/[0.08] hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2.5">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    pr.state === 'open' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  }`}>
                    {pr.state.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    #{pr.number} {pr.title}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-slate-500" />
                    {pr.head} → {pr.base}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    {pr.user}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(pr.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <a
                href={pr.url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-medium border border-white/10 transition-colors flex items-center space-x-1.5 self-start sm:self-auto flex-shrink-0"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && pullRequests.length === 0 && !error && (
        <div className="p-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <GitPullRequest className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Pull Requests Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No pull requests found for {selectedRepo}. Use the "Code Diff & Repair" tab to run an autonomous refactor and dispatch your first Pull Request!
          </p>
        </div>
      )}
    </div>
  );
}

