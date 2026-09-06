import React from 'react';
import { ConfidenceLevel } from '../../types';
import { getConfidenceBadge } from '../../lib/utils';
import { ShieldCheck, Eye, FileCode2 } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  showIcon?: boolean;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, showIcon = true, className = '' }) => {
  const meta = getConfidenceBadge(confidence);

  const getIcon = () => {
    switch (confidence) {
      case 'HIGH':
        return <ShieldCheck className="w-3.5 h-3.5 mr-1" />;
      case 'MEDIUM':
        return <Eye className="w-3.5 h-3.5 mr-1" />;
      case 'LOW':
        return <FileCode2 className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border font-medium ${meta.badgeClass} ${className}`}
      title={meta.label}
    >
      {showIcon && getIcon()}
      <span>{confidence}</span>
    </span>
  );
};
