import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Project } from '../types';
import { Modal } from '../components/common/Modal';
import { VerificationModal } from '../components/domain/VerificationModal';
import {
  FolderGit2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Zap,
  Compass,
  ArrowUpRight,
  Globe,
  Lock,
  ExternalLink,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [verifyingProject, setVerifyingProject] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'DNS_TXT' | 'HTTP_FILE' | 'SELF_DECLARATION'>('DNS_TXT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProjects = async () => {
    const data = await api.getProjects();
    setProjects(data);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      // Basic URL sanity check
      const parsed = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only HTTP and HTTPS target URLs are supported.');
      }

      setIsSubmitting(true);
      const newProj = await api.createProject({
        name,
        targetUrl: parsed.origin,
        verificationMethod,
      });

      setIsCreateModalOpen(false);
      setName('');
      setTargetUrl('');
      await loadProjects();

      // Open verification modal for the newly created project
      setVerifyingProject(newProj);
    } catch (err: any) {
      setFormError(err.message || 'Please enter a valid target URL.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.targetUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderGit2 className="w-6 h-6 text-brand-400" />
            <span>Target Projects</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered target domains with authorization credentials and discovery indexes.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Target Project</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter projects by name or domain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-white tracking-tight group-hover:text-brand-300 transition truncate">
                  {project.name}
                </h3>
                {project.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <button
                    onClick={() => setVerifyingProject(project)}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-medium shrink-0 transition"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Verify Now
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono break-all">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{project.targetUrl}</span>
              </div>
            </div>

            {/* Metrics Footer */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Discovered Endpoints</span>
                <span className="font-mono font-bold text-slate-200">{project.endpointCount || 0}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <Link
                  to={`/projects/${project.id}/scan`}
                  className="p-2 text-center bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <Compass className="w-3.5 h-3.5 text-brand-400" />
                  <span>Scan</span>
                </Link>

                <Link
                  to={`/projects/${project.id}/endpoints`}
                  className="p-2 text-center bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <span>Explore</span>
                </Link>

                <Link
                  to={`/projects/${project.id}/load-test`}
                  className="p-2 text-center bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Target Project"
        description="Configure target domain for automated endpoint discovery and authorized load generation."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Production Checkout API"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Website / Base API URL
            </label>
            <input
              type="text"
              placeholder="https://api.example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-brand-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              *SSRF security firewall will validate DNS resolution and block private IPv4/IPv6 ranges.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Preferred Verification Method
            </label>
            <select
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="DNS_TXT">DNS TXT Record (Enterprise / Production)</option>
              <option value="HTTP_FILE">HTTP Well-Known File (/.well-known/apiforge-verification.txt)</option>
              <option value="SELF_DECLARATION">Signed Self-Declaration (Smoke Tests Only)</option>
            </select>
          </div>

          {formError && (
            <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-400">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Validating Target...' : 'Create & Verify Target'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Verification Modal */}
      {verifyingProject && (
        <VerificationModal
          project={verifyingProject}
          isOpen={!!verifyingProject}
          onClose={() => setVerifyingProject(null)}
          onVerified={loadProjects}
        />
      )}
    </div>
  );
};
