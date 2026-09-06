import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { LoadTestMetric } from '../../types';

interface LatencyChartProps {
  data: LoadTestMetric[];
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    avg: d.latencyAvg,
    p50: d.latencyP50,
    p90: d.latencyP90,
    p95: d.latencyP95,
    p99: d.latencyP99,
  }));

  return (
    <div className="w-full h-72 bg-slate-900/60 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-300">Latency Percentiles (ms)</h4>
        <span className="text-xs text-slate-500">Live stream</span>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="ms" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#F8FAFC',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Line type="monotone" dataKey="p50" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="P50" />
          <Line type="monotone" dataKey="p90" stroke="#8B5CF6" strokeWidth={1.5} dot={false} name="P90" />
          <Line type="monotone" dataKey="p95" stroke="#F59E0B" strokeWidth={2} dot={false} name="P95" />
          <Line type="monotone" dataKey="p99" stroke="#EF4444" strokeWidth={2} dot={false} name="P99" />
          <Line type="monotone" dataKey="avg" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Avg" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
