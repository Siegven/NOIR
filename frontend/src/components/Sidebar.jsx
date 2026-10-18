import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Network, 
  Code2, 
  GitPullRequest, 
  Settings, 
  LogOut, 
  Sparkles,
  ChevronLeft,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { API_BASE } from '../apiConfig';

export default function Sidebar({ activeTab, setActiveTab, onBackToHome, onLogout, userToken }) {
  const [userProfile, setUserProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('noir_github_profile') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!userToken) {
      setUserProfile(null);
      localStorage.removeItem('noir_github_profile');
      return;
    }

    let isMounted = true;
    const fetchUserProfile = async () => {
      // 1. Try local backend endpoint first
      try {
        const res = await fetch(`${API_BASE}/api/user?token=${encodeURIComponent(userToken)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.login) {
            setUserProfile(data);
            localStorage.setItem('noir_github_profile', JSON.stringify(data));
            return;
          }
        }
      } catch (err) {
        // Fall back to direct GitHub API if backend is not reachable
      }

      // 2. Direct GitHub API fallback
      try {
        const ghRes = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${userToken}`,
            Accept: 'application/vnd.github.v3+json'
          }
        });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          const profile = {
            login: ghData.login,
            name: ghData.name || ghData.login,
            avatar_url: ghData.avatar_url,
            html_url: ghData.html_url
          };
          if (isMounted) {
            setUserProfile(profile);
            localStorage.setItem('noir_github_profile', JSON.stringify(profile));
          }
        }
      } catch (err) {
        // Silent fail
      }
    };

    fetchUserProfile();
    return () => { isMounted = false; };
  }, [userToken]);

  const navItems = [
    { id: 'repos', label: 'Repositories', icon: FolderGit2 },
    { id: 'analysis', label: 'Cross-Repo Radar', icon: Network },
    { id: 'repair', label: 'Code Diff & Repair', icon: Code2 },
    { id: 'prs', label: 'Pull Requests', icon: GitPullRequest },
    { id: 'settings', label: 'Settings & Tokens', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#0A0D14] flex flex-col h-screen sticky top-0 flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-mono font-black text-slate-950 text-base shadow-md shadow-indigo-500/20">
            N
          </div>
          <div>
            <h1 className="font-mono font-extrabold text-white text-base tracking-wider leading-none">NOIR</h1>
            <span className="text-[10px] text-indigo-400 font-mono">Console Studio</span>
          </div>
        </div>

        <button
          onClick={onBackToHome}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs flex items-center gap-1"
          title="Back to Landing Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-indigo-600/15 text-white border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {item.label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Connected Account & Profile */}
      <div className="p-4 border-t border-white/[0.08] bg-black/20">
        <div className="flex items-center space-x-3">
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={userProfile.name || userProfile.login || 'GitHub Profile'}
              className="w-8 h-8 rounded-full object-cover border border-white/15 ring-1 ring-white/10 flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-white flex-shrink-0">
              {userProfile?.login ? userProfile.login.slice(0, 2).toUpperCase() : (userToken ? "GH" : "DM")}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate leading-tight">
              {userProfile?.name || userProfile?.login || (userToken ? "GitHub User" : "Local Demo Mode")}
            </div>
            {userProfile?.login ? (
              <div className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                @{userProfile.login}
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {userToken ? "Connected" : "No token set"}
              </div>
            )}
          </div>

          {userToken && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex-shrink-0"
              title="Log out of GitHub"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

