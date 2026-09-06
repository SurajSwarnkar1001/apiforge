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

interface VUsChartProps {
  data: LoadTestMetric[];
}

export const VUsChart: React.FC<VUsChartProps> = ({ data }) => {
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    vus: d.vus,
  }));

  return (
    <div className="w-full h-72 bg-slate-900/60 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-300">Active Virtual Users (VUs)</h4>
        <span className="text-xs text-emerald-400 font-mono font-medium">
          {data.length > 0 ? `${data[data.length - 1].vus} VUs active` : '0 VUs'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="vusGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
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
            dataKey="vus"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#vusGradient)"
            name="Virtual Users"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
