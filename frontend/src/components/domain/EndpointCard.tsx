import React from 'react';
import { Endpoint } from '../../types';
import { MethodBadge } from '../common/MethodBadge';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { Lock, Zap, ArrowRight, AlertCircle, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EndpointCardProps {
  endpoint: Endpoint;
  onSelect?: (endpoint: Endpoint) => void;
}

export const EndpointCard: React.FC<EndpointCardProps> = ({ endpoint, onSelect }) => {
  return (
    <div className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Method, Path, Meta */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <MethodBadge method={endpoint.method} size="md" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition truncate">
                {endpoint.path}
              </span>
              {endpoint.authRequired && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>{endpoint.authType}</span>
                </span>
              )}
              {endpoint.isMutation && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  <span>Mutation</span>
                </span>
              )}
            </div>

            {endpoint.description && (
              <p className="mt-1 text-xs text-slate-400 line-clamp-1">{endpoint.description}</p>
            )}

            {endpoint.tags && endpoint.tags.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {endpoint.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Confidence, Source, Actions */}
        <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
          <ConfidenceBadge confidence={endpoint.confidence} />

          <div className="flex items-center gap-2">
            <Link
              to={`/projects/${endpoint.projectId}/endpoints/${endpoint.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to={`/projects/${endpoint.projectId}/load-test?endpointId=${endpoint.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-sm transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Load Test</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
