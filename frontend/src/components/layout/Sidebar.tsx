import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Compass,
  Zap,
  FileBarChart2,
  Settings,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Projects', to: '/projects', icon: <FolderGit2 className="w-4 h-4" /> },
    { label: 'Discovered Endpoints', to: '/projects/proj_ecommerce_01/endpoints', icon: <Compass className="w-4 h-4" /> },
    { label: 'Live Load Test', to: '/load-tests/lt_active_test_live', icon: <Radio className="w-4 h-4 text-brand-400 animate-pulse" /> },
    { label: 'Performance Reports', to: '/load-tests/lt_catalog_stress_02/report', icon: <FileBarChart2 className="w-4 h-4" /> },
    { label: 'Settings & Audit', to: '/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#090D16] border-r border-slate-800/80 min-h-[calc(100vh-61px)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Security & Authorization Tier Widget */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>SSRF Firewall Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Private IPv4/IPv6, localhost & cloud metadata targets blocked by default.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span>Engine: k6 v0.54</span>
        <span className="text-emerald-400 font-bold">READY</span>
      </div>
    </aside>
  );
};
