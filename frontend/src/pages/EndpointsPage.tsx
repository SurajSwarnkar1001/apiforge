import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Endpoint, HttpMethod, ConfidenceLevel } from '../types';
import { EndpointCard } from '../components/domain/EndpointCard';
import {
  Compass,
  Search,
  Filter,
  Lock,
  Zap,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

export const EndpointsPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('ALL');
  const [authOnly, setAuthOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getEndpoints(projectId);
        setEndpoints(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesSearch =
      ep.path.toLowerCase().includes(search.toLowerCase()) ||
      (ep.description && ep.description.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || ep.method === methodFilter;
    const matchesConfidence = confidenceFilter === 'ALL' || ep.confidence === confidenceFilter;
    const matchesAuth = !authOnly || ep.authRequired;

    return matchesSearch && matchesMethod && matchesConfidence && matchesAuth;
  });

  const methods: (HttpMethod | 'ALL')[] = ['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const confidences: (ConfidenceLevel | 'ALL')[] = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-brand-400" />
            <span>Discovered API Endpoints</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, inspect contract schemas, parameter definitions, and trigger single or distributed load tests.
          </p>
        </div>

        {projectId && (
          <Link
            to={`/projects/${projectId}/scan`}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition"
          >
            <Compass className="w-4 h-4 text-brand-400" />
            <span>Rerun Discovery Scan</span>
          </Link>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by path or description (e.g. /api/v1/products)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Auth only checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={authOnly}
              onChange={(e) => setAuthOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-brand-600 focus:ring-brand-500"
            />
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Auth Required Only
            </span>
          </label>
        </div>

        {/* Method & Confidence Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          {/* Method Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">Method:</span>
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  methodFilter === m
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Confidence Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">Confidence:</span>
            {confidences.map((c) => (
              <button
                key={c}
                onClick={() => setConfidenceFilter(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  confidenceFilter === c
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {filteredEndpoints.length} of {endpoints.length} endpoints</span>
        </div>

        {filteredEndpoints.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-12 text-center space-y-3">
            <Compass className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No matching endpoints discovered</p>
            <p className="text-xs text-slate-500">Try adjusting your search queries or filter selections.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEndpoints.map((endpoint) => (
              <EndpointCard key={endpoint.id} endpoint={endpoint} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
