import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Star, 
  GitFork, 
  Search, 
  ArrowRight, 
  RefreshCw, 
  Loader2,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function RepositoriesView({ userToken, repoQualityMap = {}, onSelectRepoForScan }) {
  const [repos, setRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRealRepos = async () => {
    if (!userToken) {
      setRepos([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/repos?token=${encodeURIComponent(userToken)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setRepos(data.repositories || []);
    } catch (err) {
      setError(err.message);
      setRepos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealRepos();
  }, [userToken]);

  const filteredRepos = repos.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-400" />
            Your GitHub Repositories
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {repos.length > 0 
              ? `Connected: ${repos.length} live repositories loaded from your GitHub account.` 
              : "Select a repository to begin automated architectural repair."}
          </p>
        </div>

        {userToken && (
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchRealRepos}
              disabled={isLoading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors text-xs flex items-center gap-1.5 disabled:opacity-50"
              title="Refresh Repositories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {userToken && repos.length > 0 && (
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Fetching your real repositories from GitHub...</p>
        </div>
      )}

      {/* Not Logged In State */}
      {!userToken && !isLoading && (
        <div className="p-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">GitHub Account Not Linked</h3>
            <p className="text-xs text-slate-400 mt-1">
              Authenticate via GitHub OAuth to view and select your real repositories for automated scanning.
            </p>
          </div>
        </div>
      )}

      {/* Repository Grid (100% Real Data) */}
      {!isLoading && userToken && filteredRepos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="p-5 rounded-xl bg-[#0B0F17] border border-white/[0.08] hover:border-indigo-500/40 hover:bg-[#0E131E] transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-white truncate max-w-[200px]" title={repo.name}>
                    {repo.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {repoQualityMap && repoQualityMap[repo.full_name] && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        {repoQualityMap[repo.full_name].overall_score} ({repoQualityMap[repo.full_name].grade})
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {repo.language}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {repo.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400/20" />
                    {repo.stars}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5" />
                    {repo.forks}
                  </span>
                </div>

                <button
                  onClick={() => onSelectRepoForScan(repo.full_name)}
                  className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-mono font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Audit</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && userToken && filteredRepos.length === 0 && repos.length === 0 && !error && (
        <div className="p-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Repositories Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No public or accessible repositories were returned for your GitHub account.
          </p>
        </div>
      )}
    </div>
  );
}
