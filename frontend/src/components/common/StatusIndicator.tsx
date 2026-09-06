import React from 'react';
import { LoadTestStatus, ScanStatus } from '../../types';
import { getStatusBadge } from '../../lib/utils';

interface StatusIndicatorProps {
  status: LoadTestStatus | ScanStatus;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '' }) => {
  const meta = getStatusBadge(status);

  return (
    <span
      className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium ${meta.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
};
