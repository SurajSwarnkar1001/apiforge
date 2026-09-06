import React from 'react';
import { HttpMethod } from '../../types';
import { getMethodBg } from '../../lib/utils';

interface MethodBadgeProps {
  method: HttpMethod;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider',
    md: 'text-xs px-2 py-0.5 rounded-md font-bold tracking-wide',
    lg: 'text-sm px-3 py-1 rounded-md font-bold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-mono border ${getMethodBg(
        method
      )} ${sizeClasses[size]} ${className}`}
    >
      {method}
    </span>
  );
};
