import React, { useState } from 'react';
import { Project, VerificationMethod } from '../../types';
import { Modal } from '../common/Modal';
import { ShieldCheck, Copy, Check, ExternalLink, AlertTriangle, KeyRound, Globe, FileCheck } from 'lucide-react';
import { api } from '../../lib/api';

interface VerificationModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  project,
  isOpen,
  onClose,
  onVerified,
}) => {
  const [method, setMethod] = useState<VerificationMethod>('DNS_TXT');
  const [copiedToken, setCopiedToken] = useState(false);
  const [selfDeclared, setSelfDeclared] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleVerify = async () => {
    if (method === 'SELF_DECLARATION' && !selfDeclared) {
      setError('You must explicitly confirm authorized ownership before proceeding.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await api.verifyProject(project.id, method);
      if (res.isVerified) {
        onVerified();
        onClose();
      } else {
        setError(res.message || 'Verification failed. Please check the DNS records or file location.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Verification request failed. Ensure target is accessible.');
    } finally {
      setIsVerifying(false);
    }
  };

  const domain = new URL(project.targetUrl).hostname;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Target Domain Ownership"
      description="To prevent unauthorized denial-of-service abuse, high-volume load testing is strictly limited to verified targets."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Method Selector */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => { setMethod('DNS_TXT'); setError(null); }}
            className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition ${
              method === 'DNS_TXT'
                ? 'border-brand-500 bg-brand-500/10 text-white'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Globe className="w-5 h-5 text-brand-400" />
            <div>
              <div className="text-xs font-bold">DNS TXT Record</div>
              <div className="text-[10px] text-slate-400">Enterprise Recommended</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setMethod('HTTP_FILE'); setError(null); }}
            className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition ${
              method === 'HTTP_FILE'
                ? 'border-brand-500 bg-brand-500/10 text-white'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-bold">HTTP File</div>
              <div className="text-[10px] text-slate-400">Fast Web Server Verification</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setMethod('SELF_DECLARATION'); setError(null); }}
            className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition ${
              method === 'SELF_DECLARATION'
                ? 'border-brand-500 bg-brand-500/10 text-white'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold">Self-Declaration</div>
              <div className="text-[10px] text-slate-400">Smoke / Dev Tier Only</div>
            </div>
          </button>
        </div>

        {/* Verification Instructions */}
        {method === 'DNS_TXT' && (
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <p className="text-slate-300 font-medium">Add the following TXT record to your DNS provider for domain <span className="font-mono text-brand-300">{domain}</span>:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Record Type / Host</span>
                  <span className="font-mono text-slate-200">TXT @ (or _apiforge-challenge.{domain})</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Value</span>
                  <span className="font-mono text-emerald-400 select-all">{project.verificationToken}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(project.verificationToken)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                  title="Copy verification token"
                >
                  {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {method === 'HTTP_FILE' && (
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <p className="text-slate-300 font-medium">Host a static plain text file at the following public path on your server:</p>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-brand-300 break-all">
              {project.targetUrl.replace(/\/+$/, '')}/.well-known/apiforge-verification.txt
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Expected File Contents</span>
                <span className="font-mono text-emerald-400">{project.verificationToken}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(project.verificationToken)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {method === 'SELF_DECLARATION' && (
          <div className="space-y-3 bg-amber-950/30 p-4 rounded-xl border border-amber-900/50 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-300">Authorized Testing Acknowledgment</h4>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  By selecting self-declaration, you legally acknowledge that you have authorization from the infrastructure owner to generate load against <span className="font-mono text-white">{project.targetUrl}</span>.
                </p>
                <p className="text-slate-400 mt-2 text-[11px]">
                  *Note: Self-declared targets are rate-limited to Smoke presets (&le; 10 Virtual Users). Full DNS/HTTP verification unlocks high-concurrency stress testing.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 mt-4 pt-3 border-t border-amber-900/40 cursor-pointer">
              <input
                type="checkbox"
                checked={selfDeclared}
                onChange={(e) => setSelfDeclared(e.target.checked)}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span className="text-slate-200 font-medium select-none">
                I confirm that I own or am explicitly authorized by written consent to conduct API discovery and load testing against this target.
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 rounded-xl shadow-lg shadow-brand-600/20 transition"
          >
            {isVerifying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Checking Authorization...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Ownership</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
