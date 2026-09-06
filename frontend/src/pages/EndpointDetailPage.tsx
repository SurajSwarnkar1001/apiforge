import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Endpoint } from '../types';
import { MethodBadge } from '../components/common/MethodBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import {
  Send,
  Zap,
  Lock,
  AlertTriangle,
  Play,
  ChevronLeft,
  Copy,
  Check,
  Code2,
  Clock,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export const EndpointDetailPage: React.FC = () => {
  const { id: projectId, endpointId } = useParams<{ id: string; endpointId: string }>();
  const navigate = useNavigate();
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
  const [activeTab, setActiveTab] = useState<'PARAMS' | 'HEADERS' | 'BODY' | 'RESPONSE'>('PARAMS');

  // Request builder states
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string; enabled: boolean }>>([]);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string; enabled: boolean }>>([]);
  const [requestBody, setRequestBody] = useState<string>('{\n  \n}');
  const [authHeader, setAuthHeader] = useState<string>('');

  // Single test execution response state
  const [isSending, setIsSending] = useState(false);
  const [responseOutput, setResponseOutput] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    durationMs: number;
  } | null>(null);

  useEffect(() => {
    if (!endpointId) return;
    api.getEndpoint(endpointId).then((ep) => {
      setEndpoint(ep);

      // Populate query params from definition
      if (ep.queryParameters) {
        setQueryParams(
          ep.queryParameters.map((p) => ({
            key: p.name,
            value: p.defaultValue || p.example || '',
            enabled: true,
          }))
        );
      } else {
        setQueryParams([{ key: '', value: '', enabled: true }]);
      }

      // Populate headers
      if (ep.headers) {
        setHeaders(
          Object.entries(ep.headers).map(([k, v]) => ({
            key: k,
            value: v,
            enabled: true,
          }))
        );
      } else {
        setHeaders([
          { key: 'Content-Type', value: 'application/json', enabled: true },
          { key: 'Accept', value: 'application/json', enabled: true },
        ]);
      }

      // Populate body
      if (ep.requestBody) {
        setRequestBody(
          typeof ep.requestBody === 'string'
            ? ep.requestBody
            : JSON.stringify(ep.requestBody, null, 2)
        );
      }
    });
  }, [endpointId]);

  const handleSendRequest = async () => {
    if (!endpoint) return;
    setIsSending(true);
    setActiveTab('RESPONSE');

    try {
      const activeHeaders: Record<string, string> = {};
      headers.filter((h) => h.enabled && h.key).forEach((h) => (activeHeaders[h.key] = h.value));
      if (authHeader) {
        activeHeaders['Authorization'] = authHeader;
      }

      const activeQuery: Record<string, string> = {};
      queryParams.filter((q) => q.enabled && q.key).forEach((q) => (activeQuery[q.key] = q.value));

      let parsedBody: any = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch {
          parsedBody = requestBody;
        }
      }

      const res = await api.executeSingleRequest(endpoint.id, {
        headers: activeHeaders,
        queryParams: activeQuery,
        body: parsedBody,
      });

      setResponseOutput(res);
    } finally {
      setIsSending(false);
    }
  };

  if (!endpoint) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Endpoint Header Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <MethodBadge method={endpoint.method} size="lg" />
            <span className="font-mono text-lg font-bold text-white tracking-tight break-all">
              {endpoint.path}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ConfidenceBadge confidence={endpoint.confidence} />
            <Link
              to={`/projects/${endpoint.projectId}/load-test?endpointId=${endpoint.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20 transition"
            >
              <Zap className="w-4 h-4" />
              <span>Create Load Test</span>
            </Link>
          </div>
        </div>

        {endpoint.description && (
          <p className="text-xs text-slate-300 leading-relaxed">{endpoint.description}</p>
        )}

        {/* Mutation Safety Warning */}
        {endpoint.isMutation && (
          <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mutation Safety Protocol: </span>
              This {endpoint.method} endpoint alters persistent state. It was not executed automatically during discovery and requires explicit test payloads.
            </div>
          </div>
        )}
      </div>

      {/* Interactive Request & Response Workspace */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Workspace Action Bar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('PARAMS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'PARAMS'
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Query Params ({queryParams.filter((q) => q.key).length})
            </button>
            <button
              onClick={() => setActiveTab('HEADERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'HEADERS'
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Headers ({headers.filter((h) => h.key).length})
            </button>
            {['POST', 'PUT', 'PATCH'].includes(endpoint.method) && (
              <button
                onClick={() => setActiveTab('BODY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'BODY'
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                JSON Body
              </button>
            )}
            <button
              onClick={() => setActiveTab('RESPONSE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'RESPONSE'
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Response {responseOutput && `(${responseOutput.status})`}
            </button>
          </div>

          <button
            onClick={handleSendRequest}
            disabled={isSending}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-md transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Sending...' : 'Send Request'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Query Params Tab */}
          {activeTab === 'PARAMS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">
                <div className="col-span-1 text-center">Active</div>
                <div className="col-span-5">Key / Parameter</div>
                <div className="col-span-6">Value</div>
              </div>

              {queryParams.map((param, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-1 text-center">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => {
                        const copy = [...queryParams];
                        copy[idx].enabled = e.target.checked;
                        setQueryParams(copy);
                      }}
                      className="rounded bg-slate-950 border-slate-700 text-brand-600"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Parameter name"
                      value={param.key}
                      onChange={(e) => {
                        const copy = [...queryParams];
                        copy[idx].key = e.target.value;
                        setQueryParams(copy);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => {
                        const copy = [...queryParams];
                        copy[idx].value = e.target.value;
                        setQueryParams(copy);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setQueryParams([...queryParams, { key: '', value: '', enabled: true }])}
                className="text-xs text-brand-400 hover:underline font-semibold pt-2 block"
              >
                + Add Parameter
              </button>
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === 'HEADERS' && (
            <div className="space-y-4">
              {endpoint.authRequired && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Authorization Header ({endpoint.authType})
                  </label>
                  <input
                    type="text"
                    placeholder="Bearer <token> or ApiKey <key>"
                    value={authHeader}
                    onChange={(e) => setAuthHeader(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              <div className="space-y-3">
                {headers.map((h, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-1 text-center">
                      <input
                        type="checkbox"
                        checked={h.enabled}
                        onChange={(e) => {
                          const copy = [...headers];
                          copy[idx].enabled = e.target.checked;
                          setHeaders(copy);
                        }}
                        className="rounded bg-slate-950 border-slate-700 text-brand-600"
                      />
                    </div>
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={h.key}
                        onChange={(e) => {
                          const copy = [...headers];
                          copy[idx].key = e.target.value;
                          setHeaders(copy);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={h.value}
                        onChange={(e) => {
                          const copy = [...headers];
                          copy[idx].value = e.target.value;
                          setHeaders(copy);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JSON Body Tab */}
          {activeTab === 'BODY' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Payload JSON</label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-brand-500 leading-relaxed"
              />
            </div>
          )}

          {/* Response Tab */}
          {activeTab === 'RESPONSE' && (
            <div className="space-y-4">
              {responseOutput ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      {responseOutput.status} {responseOutput.statusText}
                    </span>
                    <span className="text-slate-400">
                      Duration: <strong className="text-white">{responseOutput.durationMs}ms</strong>
                    </span>
                  </div>

                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 overflow-auto max-h-[350px]">
                    {JSON.stringify(responseOutput.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Click <strong>Send Request</strong> to execute a single safe probe and inspect the server response.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
