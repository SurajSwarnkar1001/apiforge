import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Project, Endpoint, LoadTest } from '../types';
import { MethodBadge } from '../components/common/MethodBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { VerificationModal } from '../components/domain/VerificationModal';
import {
  FolderGit2,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Compass,
  Zap,
  Clock,
  ArrowRight,
  Activity,
  Layers,
  ChevronLeft,
} from 'lucide-react';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loadTests, setLoadTests] = useState<LoadTest[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      const [projData, epData, ltData] = await Promise.all([
        api.getProject(id),
        api.getEndpoints(id),
        api.getLoadTests(id),
      ]);
      setProject(projData);
      setEndpoints(epData);
      setLoadTests(ltData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* Project Banner Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
            {project.isVerified ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Verified Target
              </span>
            ) : (
              <button
                onClick={() => setIsVerifying(true)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-semibold transition"
              >
                <ShieldAlert className="w-4 h-4" />
                Unverified (Click to Authorize)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="text-slate-200">{project.targetUrl}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to={`/projects/${project.id}/scan`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
          >
            <Compass className="w-4 h-4 text-brand-400" />
            <span>Scan APIs</span>
          </Link>

          <Link
            to={`/projects/${project.id}/endpoints`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>View Endpoints</span>
          </Link>

          <Link
            to={`/projects/${project.id}/load-test`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20 transition"
          >
            <Zap className="w-4 h-4" />
            <span>Run Load Test</span>
          </Link>
        </div>
      </div>

      {/* Discovered Endpoints Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-400" />
            <span>Discovered Endpoints ({endpoints.length})</span>
          </h2>
          <Link
            to={`/projects/${project.id}/endpoints`}
            className="text-xs text-brand-400 hover:underline flex items-center gap-1"
          >
            Explore all in detail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
          {endpoints.map((ep) => (
            <div
              key={ep.id}
              className="p-4 hover:bg-slate-850/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <MethodBadge method={ep.method} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs font-semibold text-slate-100 truncate">{ep.path}</div>
                  <div className="text-[11px] text-slate-400 truncate">{ep.description || 'Endpoint'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ConfidenceBadge confidence={ep.confidence} showIcon={false} />
                <Link
                  to={`/projects/${project.id}/endpoints/${ep.id}`}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Inspect
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Load Tests for this Project */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Load Test Executions ({loadTests.length})</span>
        </h2>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
          {loadTests.map((test) => (
            <div
              key={test.id}
              className="p-4 hover:bg-slate-850/50 transition flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MethodBadge method={test.method} size="sm" />
                  <span className="text-xs font-bold text-slate-100">{test.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {test.preset}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {test.vus} VUs • {test.durationSeconds}s
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusIndicator status={test.status} />
                <Link
                  to={`/load-tests/${test.id}/report`}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Modal */}
      {isVerifying && (
        <VerificationModal
          project={project}
          isOpen={isVerifying}
          onClose={() => setIsVerifying(false)}
          onVerified={loadData}
        />
      )}
    </div>
  );
};
