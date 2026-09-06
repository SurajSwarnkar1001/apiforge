import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Project, Endpoint, LoadTestPreset, ThresholdRule, HttpMethod } from '../types';
import { MethodBadge } from '../components/common/MethodBadge';
import {
  Zap,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Clock,
  Users,
  Gauge,
  Sliders,
  Play,
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react';

export const LoadTestConfigPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const endpointIdParam = searchParams.get('endpointId');
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(endpointIdParam || '');

  // Form Config
  const [testName, setTestName] = useState('High-Concurrency Endpoint Benchmark');
  const [preset, setPreset] = useState<LoadTestPreset>('SMOKE');
  const [vus, setVus] = useState<number>(10);
  const [duration, setDuration] = useState<number>(30);
  const [rampUp, setRampUp] = useState<number>(5);
  const [steadyState, setSteadyState] = useState<number>(20);
  const [rampDown, setRampDown] = useState<number>(5);

  // Auth & Payload
  const [bearerToken, setBearerToken] = useState('');
  const [requestBody, setRequestBody] = useState('');

  // Thresholds
  const [p95Threshold, setP95Threshold] = useState<number>(500);
  const [p99Threshold, setP99Threshold] = useState<number>(1000);
  const [maxErrorRate, setMaxErrorRate] = useState<number>(1.0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    api.getProject(projectId).then(setProject);
    api.getEndpoints(projectId).then((eps) => {
      setEndpoints(eps);
      if (!selectedEndpointId && eps.length > 0) {
        setSelectedEndpointId(eps[0].id);
      }
    });
  }, [projectId]);

  const handlePresetSelect = (p: LoadTestPreset) => {
    setPreset(p);
    switch (p) {
      case 'SMOKE':
        setVus(10);
        setDuration(30);
        setRampUp(5);
        setSteadyState(20);
        setRampDown(5);
        break;
      case 'LOAD':
        setVus(100);
        setDuration(300);
        setRampUp(30);
        setSteadyState(240);
        setRampDown(30);
        break;
      case 'STRESS':
        setVus(250);
        setDuration(180);
        setRampUp(40);
        setSteadyState(100);
        setRampDown(40);
        break;
      case 'SPIKE':
        setVus(300);
        setDuration(60);
        setRampUp(5);
        setSteadyState(45);
        setRampDown(10);
        break;
      case 'CUSTOM':
        break;
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setError(null);

    // Unverified target safety check
    if (!project.isVerified && vus > 10) {
      setError('Target is unverified. Unverified targets are limited to Smoke tests (max 10 Virtual Users). Please verify domain ownership first.');
      return;
    }

    const selectedEp = endpoints.find((e) => e.id === selectedEndpointId);
    const targetUrl = selectedEp ? selectedEp.url : project.targetUrl;
    const method: HttpMethod = selectedEp ? selectedEp.method : 'GET';

    const thresholds: ThresholdRule[] = [
      { metric: 'http_req_duration_p95', operator: '<', value: p95Threshold },
      { metric: 'http_req_duration_p99', operator: '<', value: p99Threshold },
      { metric: 'http_req_failed', operator: '<', value: maxErrorRate / 100 },
    ];

    setIsSubmitting(true);
    try {
      const res = await api.createLoadTest({
        name: testName,
        projectId: project.id,
        endpointId: selectedEp?.id,
        targetUrl,
        method,
        preset,
        vus,
        durationSeconds: duration,
        rampUpSeconds: rampUp,
        steadyStateSeconds: steadyState,
        rampDownSeconds: rampDown,
        thresholds,
        body: requestBody || undefined,
        authConfig: bearerToken
          ? {
              type: 'BEARER',
              bearerToken,
            }
          : undefined,
      });

      navigate(`/load-tests/${res.loadTest.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to dispatch load test job to worker pool.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEp = endpoints.find((e) => e.id === selectedEndpointId);

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Back */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Zap className="w-6 h-6 text-brand-400" />
          <span>Configure Authorized Load Test</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Synthesize k6 execution scripts and dispatch isolated jobs to distributed worker containers.
        </p>
      </div>

      <form onSubmit={handleLaunch} className="space-y-6">
        {/* Step 1: Endpoint & Target Selection */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">1</span>
            Target Endpoint
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Scenario Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Endpoint</label>
              <select
                value={selectedEndpointId}
                onChange={(e) => setSelectedEndpointId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
              >
                {endpoints.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    [{ep.method}] {ep.path}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedEp && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-mono text-xs text-slate-200">
                <MethodBadge method={selectedEp.method} size="sm" />
                <span className="truncate">{selectedEp.url}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{selectedEp.confidence} Confidence</span>
            </div>
          )}
        </div>

        {/* Step 2: Preset Profiles */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">2</span>
            Load Testing Profile Presets
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: 'SMOKE', label: 'Smoke', vus: '10 VUs', dur: '30s', desc: 'Minimal sanity test' },
              { key: 'LOAD', label: 'Load', vus: '100 VUs', dur: '5m', desc: 'Sustained peak volume' },
              { key: 'STRESS', label: 'Stress', vus: '250 VUs', dur: '3m', desc: 'Progressive stress limit' },
              { key: 'SPIKE', label: 'Spike', vus: '300 VUs', dur: '1m', desc: 'Sudden traffic surge' },
              { key: 'CUSTOM', label: 'Custom', vus: 'Custom', dur: 'Flexible', desc: 'User-defined stages' },
            ].map((item) => (
              <button
                type="button"
                key={item.key}
                onClick={() => handlePresetSelect(item.key as LoadTestPreset)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition ${
                  preset === item.key
                    ? 'border-brand-500 bg-brand-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{item.label}</div>
                  <div className="text-[10px] text-brand-400 font-mono mt-0.5">{item.vus} • {item.dur}</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">{item.desc}</div>
              </button>
            ))}
          </div>

          {/* Ramping Sliders & Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Max Virtual Users</label>
              <input
                type="number"
                value={vus}
                onChange={(e) => setVus(Number(e.target.value))}
                min={1}
                max={1000}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ramp-Up Duration</label>
              <input
                type="number"
                value={rampUp}
                onChange={(e) => setRampUp(Number(e.target.value))}
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Steady State</label>
              <input
                type="number"
                value={steadyState}
                onChange={(e) => setSteadyState(Number(e.target.value))}
                min={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ramp-Down Duration</label>
              <input
                type="number"
                value={rampDown}
                onChange={(e) => setRampDown(Number(e.target.value))}
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Threshold Criteria */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">3</span>
            Performance Pass / Fail Thresholds
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">P95 Latency Threshold (ms)</label>
              <input
                type="number"
                value={p95Threshold}
                onChange={(e) => setP95Threshold(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-500">http_req_duration(p95) &lt; {p95Threshold}ms</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">P99 Latency Threshold (ms)</label>
              <input
                type="number"
                value={p99Threshold}
                onChange={(e) => setP99Threshold(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-500">http_req_duration(p99) &lt; {p99Threshold}ms</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Max Failure Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={maxErrorRate}
                onChange={(e) => setMaxErrorRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-500">http_req_failed &lt; {maxErrorRate}%</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-400 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Execution Prevented: </span>
              {error}
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 text-xs font-bold text-white uppercase tracking-wider bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-xl shadow-xl shadow-brand-600/25 transition"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Synthesizing k6 Script & Launching...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Launch Distributed Load Test</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
