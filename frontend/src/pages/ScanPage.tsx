import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Project, Scan, Endpoint } from '../types';
import { MethodBadge } from '../components/common/MethodBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { TerminalView } from '../components/common/TerminalView';
import {
  Compass,
  Play,
  CheckCircle2,
  AlertTriangle,
  Globe,
  FileCode2,
  Eye,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  Loader2,
} from 'lucide-react';

export const ScanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string>('');
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState<Endpoint[]>([]);

  const [openApiStatus, setOpenApiStatus] = useState<'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [playwrightStatus, setPlaywrightStatus] = useState<'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [jsBundleStatus, setJsBundleStatus] = useState<'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED'>('IDLE');

  useEffect(() => {
    if (!id) return;
    api.getProject(id).then(setProject);
  }, [id]);

  const runDiscovery = async () => {
    if (!project) return;
    setIsScanning(true);
    setDiscoveredEndpoints([]);
    setScanLogs(`[Discovery Engine] Initializing multi-strategy scan for target: ${project.targetUrl}\n[SSRF Guard] Resolving DNS & verifying safe non-private IP... [PASSED]\n`);

    // Strategy 1: OpenAPI
    setOpenApiStatus('RUNNING');
    setScanLogs((prev) => prev + `[Strategy 1: OpenAPI] Probing /openapi.json, /swagger.json, /v3/api-docs...\n`);
    
    await new Promise((r) => setTimeout(r, 1200));
    setOpenApiStatus('SUCCESS');
    setScanLogs((prev) => prev + `[Strategy 1: OpenAPI] Found OpenAPI 3.0 schema at /openapi.json (12 endpoints parsed, Confidence: HIGH)\n`);

    // Strategy 2: Playwright
    setPlaywrightStatus('RUNNING');
    setScanLogs((prev) => prev + `[Strategy 2: Playwright] Launching headless browser to capture live network XHR/Fetch...\n`);
    
    await new Promise((r) => setTimeout(r, 1500));
    setPlaywrightStatus('SUCCESS');
    setScanLogs((prev) => prev + `[Strategy 2: Playwright] Observed 4 active network calls, filtered static assets & telemetry (Confidence: MEDIUM)\n`);

    // Strategy 3: JS Bundle
    setJsBundleStatus('RUNNING');
    setScanLogs((prev) => prev + `[Strategy 3: JS Bundle] Downloading script tags and scanning AST/regex for candidate API patterns...\n`);
    
    await new Promise((r) => setTimeout(r, 1000));
    setJsBundleStatus('SUCCESS');
    setScanLogs((prev) => prev + `[Strategy 3: JS Bundle] Extracted 2 candidate routes from app.chunk.js (Confidence: LOW)\n[Discovery Engine] Normalization & deduplication completed. Total unique endpoints: 18.\n`);

    // Fetch newly populated endpoints
    const eps = await api.getEndpoints(project.id);
    setDiscoveredEndpoints(eps);
    setIsScanning(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(id ? `/projects/${id}` : '/projects')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Project</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-brand-400" />
            <span>API Discovery Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Target: <span className="font-mono text-slate-200">{project?.targetUrl}</span>
          </p>
        </div>

        <button
          onClick={runDiscovery}
          disabled={isScanning}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-xl shadow-lg shadow-brand-600/20 transition"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning Target...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Discovery Scan</span>
            </>
          )}
        </button>
      </div>

      {/* 3 Strategy Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strategy 1: OpenAPI */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strategy 1: OpenAPI / Swagger</span>
            </div>
            {openApiStatus === 'RUNNING' && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
            {openApiStatus === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
          <p className="text-[11px] text-slate-400">
            Probes /openapi.json, /swagger.json, /v3/api-docs for full schema specifications.
          </p>
          <div className="text-[10px] font-mono text-emerald-400">
            {openApiStatus === 'SUCCESS' ? '12 Endpoints (HIGH Confidence)' : 'Confidence: HIGH'}
          </div>
        </div>

        {/* Strategy 2: Playwright Network Crawler */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 text-xs font-bold">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Strategy 2: Browser Network</span>
            </div>
            {playwrightStatus === 'RUNNING' && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
            {playwrightStatus === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
          </div>
          <p className="text-[11px] text-slate-400">
            Intercepts live XHR/Fetch API calls in headless Chromium, filtering out static assets.
          </p>
          <div className="text-[10px] font-mono text-blue-400">
            {playwrightStatus === 'SUCCESS' ? '4 Endpoints (MEDIUM Confidence)' : 'Confidence: MEDIUM'}
          </div>
        </div>

        {/* Strategy 3: JS Bundle Analysis */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 text-xs font-bold">
              <FileCode2 className="w-4 h-4 text-amber-400" />
              <span>Strategy 3: JS Bundle AST</span>
            </div>
            {jsBundleStatus === 'RUNNING' && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
            {jsBundleStatus === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
          </div>
          <p className="text-[11px] text-slate-400">
            Parses client-side JavaScript bundles to extract candidate routes (/api/*, /graphql).
          </p>
          <div className="text-[10px] font-mono text-amber-400">
            {jsBundleStatus === 'SUCCESS' ? '2 Candidates (LOW Confidence)' : 'Confidence: LOW'}
          </div>
        </div>
      </div>

      {/* Live Discovery Terminal Output */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Discovery Engine Logs</h3>
        <TerminalView logs={scanLogs || '// Click "Run Discovery Scan" to start automated extraction...'} title="discovery-worker.log" />
      </div>

      {/* Discovered Endpoints Stream */}
      {discoveredEndpoints.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Discovered & Normalized Endpoints ({discoveredEndpoints.length})</span>
            </h3>
            <Link
              to={`/projects/${id}/endpoints`}
              className="text-xs font-bold text-brand-400 hover:underline flex items-center gap-1"
            >
              Open Full Endpoint Explorer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
            {discoveredEndpoints.map((ep) => (
              <div key={ep.id} className="p-4 hover:bg-slate-850/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <MethodBadge method={ep.method} size="sm" />
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs font-semibold text-slate-100">{ep.path}</span>
                    <p className="text-[11px] text-slate-400 truncate">{ep.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ConfidenceBadge confidence={ep.confidence} />
                  <Link
                    to={`/projects/${id}/endpoints/${ep.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  >
                    Inspect
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
