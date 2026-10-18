import React, { useState } from 'react';
import { FolderGit2, Star, GitFork, Search, Play, Sparkles } from 'lucide-react';

export default function RepoSelector({ repos, selectedRepo, onSelectRepo, onAnalyze, isAnalyzing }) {
  const [searchTerm, setSearchTerm] = useState("");

  const defaultRepos = repos && repos.length > 0 ? repos : [
    {
      name: "sample_buggy_repo",
      full_name: "your-org/sample_buggy_repo",
      description: "Python queue processing microservice with architectural vulnerabilities and missing dependencies.",
      language: "Python",
      stars: 42,
      forks: 12,
      updated_at: "Just now"
    },
    {
      name: "queue-management-api",
      full_name: "your-org/queue-management-api",
      description: "Hospital patient priority dispatcher with async queue workers.",
      language: "Python",
      stars: 128,
      forks: 34,
      updated_at: "2 hours ago"
    },
    {
      name: "express-auth-gateway",
      full_name: "your-org/express-auth-gateway",
      description: "Authentication and rate-limiting gateway microservice.",
      language: "TypeScript",
      stars: 256,
      forks: 67,
      updated_at: "Yesterday"
    }
  ];

  const filtered = defaultRepos.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 my-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-noir-accent" />
            Select Repository for NOIR Autonomous Scan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose a repository to trigger Structural Cross-Repo RAG and automated repair.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-noir-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-noir-accent/60 transition-colors font-mono"
          />
        </div>
      </div>

      {/* Grid of Repository Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((repo, idx) => {
          const isSelected = selectedRepo === repo.name;
          return (
            <div
              key={idx}
              onClick={() => onSelectRepo(repo.name)}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border relative ${
                isSelected
                  ? 'bg-noir-900 border-noir-accent ring-1 ring-noir-accent/50 shadow-lg shadow-noir-accent/10'
                  : 'bg-noir-950/50 border-white/5 hover:border-white/20 hover:bg-noir-900/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-white group-hover:text-noir-accent transition-colors truncate max-w-[180px]">
                  {repo.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-indigo-300">
                  {repo.language}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {repo.description}
              </p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    {repo.stars}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3 h-3 text-slate-400" />
                    {repo.forks}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRepo(repo.name);
                    onAnalyze(repo.name);
                  }}
                  disabled={isAnalyzing}
                  className="px-2.5 py-1 rounded bg-noir-accent/20 hover:bg-noir-accent text-indigo-300 hover:text-white font-mono font-semibold transition-all duration-150 flex items-center gap-1 border border-noir-accent/30 disabled:opacity-50"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Scan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

