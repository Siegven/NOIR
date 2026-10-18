import React from 'react';
import { Target, Zap, GitPullRequest, Award } from 'lucide-react';

export default function StatsBar() {
  const stats = [
    {
      label: "Format Compliance",
      value: "99.2%",
      subtext: "Zero conversational fluff",
      icon: Target,
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400"
    },
    {
      label: "Cross-Repo RAG Match",
      value: "92.4%",
      subtext: "Architecture signal adherence",
      icon: Zap,
      color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400"
    },
    {
      label: "Autonomous PR Success",
      value: "95.0%",
      subtext: "Zero pipeline breakage",
      icon: GitPullRequest,
      color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400"
    },
    {
      label: "Code Maintainability",
      value: "+34.5",
      subtext: "Radon Index improvement",
      icon: Award,
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="glass-panel p-4 rounded-xl relative overflow-hidden group hover:border-white/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{item.label}</span>
              <div className={`p-2 rounded-lg bg-gradient-to-br border ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-black text-white tracking-tight">{item.value}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{item.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}

