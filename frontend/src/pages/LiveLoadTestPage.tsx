import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { LoadTest, LoadTestMetric } from '../types';
import { LoadTestWebSocket } from '../lib/websocket';
import { MetricCard } from '../components/common/MetricCard';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { MethodBadge } from '../components/common/MethodBadge';
import { LatencyChart } from '../components/charts/LatencyChart';
import { RPSChart } from '../components/charts/RPSChart';
import { VUsChart } from '../components/charts/VUsChart';
import { StatusDistributionChart } from '../components/charts/StatusDistributionChart';
import { TerminalView } from '../components/common/TerminalView';
import {
  Zap,
  Square,
  Activity,
  Users,
  Gauge,
  Clock,
  Sparkles,
  AlertTriangle,
  FileBarChart2,
  Radio,
  ChevronLeft,
} from 'lucide-react';

export const LiveLoadTestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const testId = id || 'lt_active_test_live';

  const [loadTest, setLoadTest] = useState<LoadTest | null>(null);
  const [metrics, setMetrics] = useState<LoadTestMetric[]>([]);
  const [isStopping, setIsStopping] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const wsRef = useRef<LoadTestWebSocket | null>(null);

  useEffect(() => {
    // Load test metadata
    api.getLoadTest(testId).then((data) => {
      setLoadTest(data);
    });

    // Initialize initial metric history
    api.getLoadTestMetrics(testId).then((initialMetrics) => {
      setMetrics(initialMetrics);
    });

    // Initialize WebSocket live stream
    const ws = new LoadTestWebSocket(testId);
    wsRef.current = ws;

    ws.onMetric((newMetric) => {
      setMetrics((prev) => [...prev.slice(-40), newMetric]);
    });

    ws.onStatus((statusUpdate) => {
      setLoadTest((prev) => (prev ? { ...prev, status: statusUpdate.status as any, stoppedReason: statusUpdate.stoppedReason } : null));
    });

    ws.connect();

    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      ws.disconnect();
      clearInterval(timer);
    };
  }, [testId]);

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await api.stopLoadTest(testId);
      if (loadTest) {
        setLoadTest({ ...loadTest, status: 'STOPPED', stoppedReason: 'Terminated by operator' });
      }
    } finally {
      setIsStopping(false);
    }
  };

  const latest = metrics[metrics.length - 1] || {
    vus: 0,
    rps: 0,
    latencyAvg: 0,
    latencyP50: 0,
    latencyP95: 0,
    latencyP99: 0,
    errorRate: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    status2xx: 0,
    status4xx: 0,
    status5xx: 0,
  };

  const statusDistribution = {
    '2xx': metrics.reduce((acc, m) => acc + (m.status2xx || 0), 0),
    '3xx': 0,
    '4xx': metrics.reduce((acc, m) => acc + (m.status4xx || 0), 0),
    '5xx': metrics.reduce((acc, m) => acc + (m.status5xx || 0), 0),
    other: 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white mr-2 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{loadTest?.name || 'Live Load Benchmark'}</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {loadTest?.preset || 'SPIKE'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            {loadTest?.method && <MethodBadge method={loadTest.method} size="sm" />}
            <span className="text-slate-200">{loadTest?.targetUrl}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {loadTest?.status === 'RUNNING' ? (
            <button
              onClick={handleStop}
              disabled={isStopping}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl shadow-lg shadow-red-600/20 transition"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>{isStopping ? 'Terminating k6...' : 'STOP TEST'}</span>
            </button>
          ) : (
            <Link
              to={`/load-tests/${testId}/report`}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20 transition"
            >
              <FileBarChart2 className="w-4 h-4" />
              <span>View Full Report</span>
            </Link>
          )}
        </div>
      </div>

      {/* Live Indicator Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {loadTest?.status === 'RUNNING' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                loadTest?.status === 'RUNNING' ? 'bg-brand-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {loadTest?.status === 'RUNNING' ? 'STREAMING REALTIME TELEMETRY (1000ms WebSocket)' : 'EXECUTION COMPLETE'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>Elapsed: <strong className="text-white">{elapsedSeconds}s</strong></span>
          <span>•</span>
          <span>Target VUs: <strong className="text-white">{loadTest?.vus || 80}</strong></span>
        </div>
      </div>

      {/* 5 Realtime Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Active Virtual Users"
          value={latest.vus}
          icon={<Users className="w-5 h-5 text-emerald-400" />}
          unit="VUs"
          variant="emerald"
        />
        <MetricCard
          label="Current Throughput"
          value={latest.rps}
          icon={<Gauge className="w-5 h-5 text-brand-400" />}
          unit="RPS"
          variant="brand"
        />
        <MetricCard
          label="P95 Latency"
          value={latest.latencyP95}
          unit="ms"
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          variant={latest.latencyP95 > 400 ? 'amber' : 'default'}
        />
        <MetricCard
          label="P99 Latency"
          value={latest.latencyP99}
          unit="ms"
          icon={<Activity className="w-5 h-5 text-red-400" />}
          variant={latest.latencyP99 > 800 ? 'red' : 'default'}
        />
        <MetricCard
          label="Error Rate"
          value={`${latest.errorRate}%`}
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          variant={latest.errorRate > 1.0 ? 'red' : 'emerald'}
        />
      </div>

      {/* Realtime Charts Grid (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatencyChart data={metrics} />
        <RPSChart data={metrics} />
        <VUsChart data={metrics} />
        <StatusDistributionChart distribution={statusDistribution} />
      </div>

      {/* Terminal View Output */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">k6 Execution Stream</h3>
        <TerminalView
          logs={`[k6-runner] Initializing isolated worker execution container...\n[k6-runner] Target: ${loadTest?.targetUrl}\n[k6-runner] Ramping profile stages initialized.\n[metrics-streamer] Dispatched ${latest.totalRequests} total requests (${latest.successfulRequests} successful, ${latest.failedRequests} errors).\n`}
          title={`k6-worker-${testId}.log`}
        />
      </div>
    </div>
  );
};
