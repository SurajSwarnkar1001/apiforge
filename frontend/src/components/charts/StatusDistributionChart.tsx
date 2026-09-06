import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { HttpStatusDistribution } from '../../types';

interface StatusDistributionChartProps {
  distribution: HttpStatusDistribution;
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ distribution }) => {
  const chartData = [
    { code: '2xx Success', count: distribution['2xx'], color: '#10B981' },
    { code: '3xx Redirect', count: distribution['3xx'], color: '#3B82F6' },
    { code: '4xx Client Err', count: distribution['4xx'], color: '#F59E0B' },
    { code: '5xx Server Err', count: distribution['5xx'], color: '#EF4444' },
    { code: 'Other', count: distribution.other, color: '#6B7280' },
  ];

  return (
    <div className="w-full h-72 bg-slate-900/60 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-300">HTTP Status Distribution</h4>
        <span className="text-xs text-slate-400">Total Count</span>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis dataKey="code" stroke="#64748B" fontSize={10} tickLine={false} />
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
