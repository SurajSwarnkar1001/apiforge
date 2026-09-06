import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { LoadTestMetric } from '../../types';

interface RPSChartProps {
  data: LoadTestMetric[];
}

export const RPSChart: React.FC<RPSChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    rps: d.rps,
  }));

  return (
    <div className="w-full h-72 bg-slate-900/60 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-300">Throughput (Requests / Sec)</h4>
        <span className="text-xs text-brand-400 font-mono font-medium">
          {data.length > 0 ? `${data[data.length - 1].rps} RPS` : '0 RPS'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="rpsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#F8FAFC',
            }}
          />
          <Area
            type="monotone"
            dataKey="rps"
            stroke="#6366F1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#rpsGradient)"
            name="RPS"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
