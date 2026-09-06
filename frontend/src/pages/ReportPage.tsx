import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { LoadTest, LoadTestResult } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { MethodBadge } from '../components/common/MethodBadge';
import { TerminalView } from '../components/common/TerminalView';
import { StatusDistributionChart } from '../components/charts/StatusDistributionChart';
import {
  FileBarChart2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Copy,
  Check,
  ChevronLeft,
  Clock,
  Gauge,
  Sparkles,
  Zap,
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const testId = id || 'lt_catalog_stress_02';

  const [loadTest, setLoadTest] = useState<LoadTest | null>(null);
  const [result, setResult] = useState<LoadTestResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getLoadTest(testId).then(setLoadTest);
    api.getLoadTestResults(testId).then(setResult);
  }, [testId]);

  if (!result || !loadTest) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allThresholdsPassed = result.thresholdsSummary.every((t) => t.passed);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ loadTest, result }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `apiforge-report-${testId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
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

      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{loadTest.name}</h1>
            {allThresholdsPassed ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                PASSED THRESHOLDS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                <AlertTriangle className="w-4 h-4" />
                THRESHOLDS BREACHED
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <MethodBadge method={loadTest.method} size="sm" />
            <span className="text-slate-200">{loadTest.targetUrl}</span>
            <span>•</span>
            <span>{loadTest.vus} Max VUs</span>
            <span>•</span>
            <span>{loadTest.durationSeconds}s Duration</span>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Primary Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Requests"
          value={result.totalRequests.toLocaleString()}
          icon={<Gauge className="w-5 h-5" />}
          subtext={`${result.avgRps.toFixed(1)} avg RPS`}
          variant="brand"
        />
        <MetricCard
          label="Success Rate"
          value={`${(100 - result.errorRatePercent).toFixed(2)}%`}
          icon={<Sparkles className="w-5 h-5 text-emerald-400" />}
          change={`${result.successfulRequests.toLocaleString()} 2xx responses`}
          isPositive={true}
          variant="emerald"
        />
        <MetricCard
          label="P95 Latency"
          value={`${result.p95Ms}ms`}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          subtext={`Avg: ${result.avgLatencyMs}ms`}
          variant="amber"
        />
        <MetricCard
          label="P99 Latency"
          value={`${result.p99Ms}ms`}
          icon={<Clock className="w-5 h-5 text-red-400" />}
          subtext={`Max: ${result.maxLatencyMs}ms`}
          variant="red"
        />
      </div>

      {/* Threshold Evaluation Summary Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <FileBarChart2 className="w-5 h-5 text-brand-400" />
          <span>Threshold Evaluation Matrix</span>
        </h2>

        <div className="divide-y divide-slate-800/80">
          {result.thresholdsSummary.map((rule, idx) => (
            <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-mono text-xs font-semibold text-slate-200">
                  {rule.metric} {rule.operator} {rule.value}
                  {rule.metric.includes('failed') ? '' : 'ms'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Recorded value: <strong className="text-white font-mono">{rule.actualValue}{rule.metric.includes('failed') ? '' : 'ms'}</strong>
                </div>
              </div>

              <div>
                {rule.passed ? (
                  <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    PASSED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-bold">
                    <XCircle className="w-4 h-4" />
                    FAILED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latency Percentiles Breakdown & HTTP Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latency Percentiles Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white tracking-tight">Latency Percentile Distribution</h3>
          <table className="w-full text-left text-xs font-mono">
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-2.5 text-slate-400">Minimum Latency</td>
                <td className="py-2.5 text-right font-bold text-slate-200">{result.minLatencyMs}ms</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-400">P50 (Median)</td>
                <td className="py-2.5 text-right font-bold text-blue-400">{result.p50Ms}ms</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-400">P90</td>
                <td className="py-2.5 text-right font-bold text-purple-400">{result.p90Ms}ms</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-400">P95</td>
                <td className="py-2.5 text-right font-bold text-amber-400">{result.p95Ms}ms</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-400">P99 (Tail Latency)</td>
                <td className="py-2.5 text-right font-bold text-red-400">{result.p99Ms}ms</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-400">Maximum Latency</td>
                <td className="py-2.5 text-right font-bold text-slate-200">{result.maxLatencyMs}ms</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* HTTP Status Breakdown Chart */}
        <StatusDistributionChart distribution={result.httpStatusBreakdown} />
      </div>

      {/* Full stdout logs from k6 */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">k6 Execution Summary Log</h3>
        <TerminalView logs={result.stdoutLog || ''} title="k6-summary-report.txt" maxHeight="300px" />
      </div>
    </div>
  );
};
