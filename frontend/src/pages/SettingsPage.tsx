import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { AuditLog } from '../types';
import {
  Settings,
  ShieldCheck,
  Lock,
  Server,
  FileText,
  KeyRound,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    api.getAuditLogs().then(setAuditLogs);
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-400" />
          <span>Platform Settings & Security Center</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          SSRF Firewall configuration, authorization validation parameters, and immutable audit logs.
        </p>
      </div>

      {/* Security Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SSRF & DNS Firewall */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>SSRF & DNS Firewall Guard</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span>Private IPv4 Range Protection</span>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE (RFC 1918)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span>Loopback & Localhost Access</span>
              <span className="text-red-400 font-mono font-bold">STRICTLY BLOCKED</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span>Cloud Metadata Protection</span>
              <span className="text-red-400 font-mono font-bold">169.254.169.254 BLOCKED</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span>DNS Rebinding Mitigation</span>
              <span className="text-emerald-400 font-mono font-bold">IP PINNING ENABLED</span>
            </div>
          </div>
        </div>

        {/* Secret Management & Worker Pools */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-brand-400 font-bold text-sm">
            <Lock className="w-5 h-5" />
            <span>Secret Encryption & Isolation</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span>Token Storage Cipher</span>
              <span className="text-brand-300 font-mono font-bold">AES-256-GCM</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span>k6 Worker Isolation</span>
              <span className="text-emerald-400 font-mono font-bold">CONTAINER SANDBOX</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span>Unverified VUs Concurrency Limit</span>
              <span className="text-amber-400 font-mono font-bold">&le; 10 VUs MAX</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span>Verified Target Concurrency Limit</span>
              <span className="text-emerald-400 font-mono font-bold">UP TO 10,000 VUs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <span>Immutable Platform Audit Logs</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Last 30 days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target / Project</th>
                <th className="py-3 px-4">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/50">
                  <td className="py-3 px-4 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/30 text-[11px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-200">{log.userName || log.userId}</td>
                  <td className="py-3 px-4 text-slate-300">{log.projectName || '-'}</td>
                  <td className="py-3 px-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
