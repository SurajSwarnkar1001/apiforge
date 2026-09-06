import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'brand' | 'emerald' | 'amber' | 'red';
  subtext?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  change,
  isPositive,
  icon,
  variant = 'default',
  subtext,
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'brand':
        return 'border-brand-500/30 hover:border-brand-500/60';
      case 'emerald':
        return 'border-emerald-500/30 hover:border-emerald-500/60';
      case 'amber':
        return 'border-amber-500/30 hover:border-amber-500/60';
      case 'red':
        return 'border-red-500/30 hover:border-red-500/60';
      default:
        return 'border-slate-800 hover:border-slate-700';
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-slate-900/80 backdrop-blur-md rounded-xl p-5 border transition-all duration-200 ${getBorderColor()}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold text-white tracking-tight font-mono">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      {(change || subtext) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {change && (
            <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {change}
            </span>
          )}
          {subtext && <span className="text-slate-500">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
