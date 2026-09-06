import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Project, Endpoint, LoadTest } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { MethodBadge } from '../components/common/MethodBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import {
  FolderGit2,
  Compass,
  Zap,
  Activity,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Plus,
  Play,
  Clock,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loadTests, setLoadTests] = useState<LoadTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [projData, epData, ltData] = await Promise.all([
          api.getProjects(),
          api.getEndpoints(),
          api.getLoadTests(),
        ]);
        setProjects(projData);
        setEndpoints(epData);
        setLoadTests(ltData);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const runningTests = loadTests.filter((t) => t.status === 'RUNNING').length;
  const completedTests = loadTests.filter((t) => t.status === 'COMPLETED').length;
  const totalEndpoints = endpoints.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Engineering Telemetry Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              Live Cluster
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Realtime visibility across discovered API contracts, verified target systems, and distributed k6 load runners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Target Project</span>
          </Link>
          <Link
            to="/load-tests/lt_active_test_live"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20 transition"
          >
            <Play className="w-4 h-4" />
            <span>View Active Test</span>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Active Projects"
          value={projects.length}
          icon={<FolderGit2 className="w-5 h-5" />}
          subtext="3 verified targets"
          variant="default"
        />
        <MetricCard
          label="Discovered Endpoints"
          value={totalEndpoints}
          icon={<Compass className="w-5 h-5" />}
          change="+12 from OpenAPI"
          isPositive={true}
          variant="brand"
        />
        <MetricCard
          label="Tests Running"
          value={runningTests}
          icon={<Activity className="w-5 h-5 text-brand-400 animate-pulse" />}
          subtext="k6 worker executing"
          variant={runningTests > 0 ? 'brand' : 'default'}
        />
        <MetricCard
          label="Tests Completed"
          value={completedTests}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          subtext="100% persisted"
          variant="emerald"
        />
        <MetricCard
          label="Avg Success Rate"
          value="99.2%"
          icon={<Sparkles className="w-5 h-5 text-amber-400" />}
          change="0.8% error rate"
          isPositive={true}
          variant="emerald"
        />
      </div>

      {/* Grid: Active / Recent Load Tests & Target Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Load Test Executions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-400" />
              <span>Load Test Executions</span>
            </h2>
            <Link to="/load-tests/lt_active_test_live" className="text-xs text-brand-400 hover:underline">
              View live stream &rarr;
            </Link>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
            {loadTests.map((test) => (
              <div
                key={test.id}
                className="p-4 hover:bg-slate-850/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <MethodBadge method={test.method} size="sm" />
                    <span className="text-xs font-bold text-slate-100">{test.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {test.preset}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="font-mono text-slate-300">{test.targetUrl}</span>
                    <span>•</span>
                    <span>{test.vus} Virtual Users</span>
                    <span>•</span>
                    <span>{test.durationSeconds}s duration</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <StatusIndicator status={test.status} />
                  {test.status === 'RUNNING' ? (
                    <Link
                      to={`/load-tests/${test.id}`}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition"
                    >
                      Monitor Live
                    </Link>
                  ) : (
                    <Link
                      to={`/load-tests/${test.id}/report`}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    >
                      View Report
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Verified Target Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Target Projects</span>
            </h2>
            <Link to="/projects" className="text-xs text-brand-400 hover:underline">
              Manage all &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {projects.map((proj) => (
              <Link
                key={proj.id}
                to={`/projects/${proj.id}`}
                className="block p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-bold text-slate-100 truncate">{proj.name}</h3>
                  {proj.isVerified ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                      Unverified
                    </span>
                  )}
                </div>
                <div className="mt-2 text-[11px] font-mono text-slate-400 truncate">{proj.targetUrl}</div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span>{proj.endpointCount || 0} endpoints found</span>
                  <span className="text-brand-400 font-medium flex items-center gap-1">
                    Details <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Discovered Endpoints Explorer Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Recent Discovered Endpoints</span>
            </h2>
            <p className="text-xs text-slate-400">
              Extracted via OpenAPI specs, Playwright network discovery, and JS bundle analysis.
            </p>
          </div>
          <Link to="/projects/proj_ecommerce_01/endpoints" className="text-xs text-brand-400 hover:underline">
            Explore all {totalEndpoints} endpoints &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {endpoints.slice(0, 4).map((ep) => (
            <div
              key={ep.id}
              className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MethodBadge method={ep.method} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-slate-200 truncate font-semibold">{ep.path}</div>
                  <div className="text-[10px] text-slate-400 truncate">{ep.description || 'Discovered endpoint'}</div>
                </div>
              </div>
              <ConfidenceBadge confidence={ep.confidence} showIcon={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
