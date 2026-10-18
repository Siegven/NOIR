import React from 'react';
import { ShieldCheck, Cpu, GitPullRequest, Sparkles, Activity } from 'lucide-react';

export default function Header({ onRefresh, isConnected }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-noir-accent to-noir-emerald flex items-center justify-center shadow-lg shadow-noir-accent/20">
              <span className="font-mono font-black text-white text-lg tracking-tighter">N</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-noir-emerald border-2 border-noir-950 animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-noir-emerald border-2 border-noir-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-extrabold text-white text-lg tracking-wider">NOIR</span>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-noir-accent/20 text-indigo-300 border border-noir-accent/30">
                v1.0 Autonomous
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Cross-Repository Code Repair & Quality RAG Engine</p>
          </div>
        </div>

        {/* Engine Status Indicators */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-noir-900 border border-white/10 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-noir-accent" />
            <span>Brain:</span>
            <span className="font-mono font-semibold text-white">Qwen 2.5 Coder (Fine-Tuned)</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-noir-900 border border-white/10 text-xs text-slate-300">
            <Activity className="w-3.5 h-3.5 text-noir-emerald" />
            <span>RAG Engine:</span>
            <span className="font-mono font-semibold text-emerald-400">Structural AST Active</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Backend Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}

