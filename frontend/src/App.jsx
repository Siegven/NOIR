import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import Sidebar from './components/Sidebar';
import RepositoriesView from './views/RepositoriesView';
import AnalysisView from './views/AnalysisView';
import RepairView from './views/RepairView';
import PullRequestsView from './views/PullRequestsView';
import SettingsView from './views/SettingsView';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [activeTab, setActiveTab] = useState('repos');
  const [userToken, setUserToken] = useState(() => localStorage.getItem('noir_github_token') || '');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const executeLogout = async (alsoSignoutGitHub = true) => {
    const token = userToken;
    setUserToken('');
    localStorage.removeItem('noir_github_token');
    localStorage.removeItem('noir_github_profile');
    setSelectedRepo(null);
    setCurrentPage('landing');
    setShowLogoutModal(false);

    if (token) {
      try {
        await fetch('/api/auth/github/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      } catch (err) {
        console.warn('Grant revocation error:', err);
      }
    }

    if (alsoSignoutGitHub) {
      window.open('https://github.com/logout', '_blank');
    }
  };
  const [repoQualityMap, setRepoQualityMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('noir_repo_quality_map') || '{}');
    } catch {
      return {};
    }
  });

  const handleUpdateQualityScore = (repoName, report) => {
    if (!repoName || !report) return;
    setRepoQualityMap(prev => {
      const updated = { ...prev, [repoName]: report };
      try {
        localStorage.setItem('noir_repo_quality_map', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Catch OAuth callback redirect (?token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setUserToken(tokenParam);
      localStorage.setItem('noir_github_token', tokenParam);
      window.history.replaceState({}, document.title, window.location.pathname);
      setCurrentPage('dashboard');
      setActiveTab('repos');
    }
  }, []);

  const handleSelectRepoForScan = (repoName) => {
    setSelectedRepo(repoName);
    setActiveTab('analysis');
  };

  const handleNavigateToRepair = () => {
    setActiveTab('repair');
  };

  const handleNavigateToRepos = () => {
    setActiveTab('repos');
  };

  const handleNavigateToAnalysis = () => {
    setActiveTab('analysis');
  };

  const logoutModalElement = showLogoutModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0D1117] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sign Out of GitHub</h3>
            <p className="text-xs text-slate-400 mt-0.5">Select how you want to sign out</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Because your browser saves your GitHub login, selecting <strong className="text-white">Full Sign Out</strong> will revoke NOIR's app authorization and open GitHub's logout page so you can enter fresh credentials from scratch next time.
        </p>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => executeLogout(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Full Sign Out (Requires Credentials Next Time)</span>
          </button>

          <button
            onClick={() => executeLogout(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold text-xs transition-all flex items-center justify-center space-x-2"
          >
            <span>Disconnect NOIR Only</span>
          </button>

          <button
            onClick={() => setShowLogoutModal(false)}
            className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // If on landing page, show the clean marketing introduction
  if (currentPage === 'landing') {
    return (
      <>
        <LandingPage
          onEnterApp={() => setCurrentPage('dashboard')}
          userToken={userToken}
          setUserToken={setUserToken}
          onLogout={() => setShowLogoutModal(true)}
        />
        {logoutModalElement}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex overflow-hidden font-sans antialiased">
      {/* Sleek Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBackToHome={() => setCurrentPage('landing')}
        onLogout={() => setShowLogoutModal(true)}
        userToken={userToken}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-white/[0.08] bg-[#0A0D14]/80 backdrop-blur-md px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">NOIR Studio</span>
            <span className="text-slate-600">/</span>
            <span className="text-white font-semibold capitalize">
              {activeTab === 'repos' ? 'Repositories' :
               activeTab === 'analysis' ? 'Cross-Repo Radar' :
               activeTab === 'repair' ? 'Code Diff & Repair' :
               activeTab === 'prs' ? 'Pull Requests' : 'Settings'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400">Active Target:</span>
            <span className="px-2.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-indigo-300 font-medium">
              {selectedRepo || "None Selected"}
            </span>
            {selectedRepo && repoQualityMap[selectedRepo] && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 font-mono text-emerald-400 text-[11px] font-bold">
                {repoQualityMap[selectedRepo].overall_score}/100 ({repoQualityMap[selectedRepo].grade})
              </span>
            )}

            {userToken && (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 transition-all text-xs font-medium"
                title="Log out of GitHub"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Viewport (Only 1 distinct view visible at a time) */}
        <main className="flex-1 overflow-y-auto p-8 max-w-6xl w-full mx-auto">
          {activeTab === 'repos' && (
            <RepositoriesView
              userToken={userToken}
              repoQualityMap={repoQualityMap}
              onSelectRepoForScan={handleSelectRepoForScan}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisView
              selectedRepo={selectedRepo}
              userToken={userToken}
              initialQualityReport={selectedRepo ? repoQualityMap[selectedRepo] : null}
              onUpdateQualityScore={handleUpdateQualityScore}
              onNavigateToRepair={handleNavigateToRepair}
              onNavigateToRepos={handleNavigateToRepos}
            />
          )}

          {activeTab === 'repair' && (
            <RepairView
              selectedRepo={selectedRepo}
              userToken={userToken}
              onUpdateQualityScore={handleUpdateQualityScore}
              onNavigateToRepos={handleNavigateToRepos}
              onNavigateToAnalysis={handleNavigateToAnalysis}
            />
          )}

          {activeTab === 'prs' && (
            <PullRequestsView
              selectedRepo={selectedRepo}
              userToken={userToken}
              onNavigateToRepos={handleNavigateToRepos}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              userToken={userToken}
              setUserToken={setUserToken}
            />
          )}
        </main>
      </div>
      {logoutModalElement}
    </div>
  );
}
