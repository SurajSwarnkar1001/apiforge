import React, { useRef, useEffect } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

interface TerminalViewProps {
  logs: string;
  title?: string;
  maxHeight?: string;
  autoScroll?: boolean;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  logs,
  title = 'k6 Execution Output',
  maxHeight = '400px',
  autoScroll = true,
}) => {
  const [copied, setCopied] = React.useState(false);
  const terminalRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#070A11] overflow-hidden font-mono shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1.5 ml-2 font-medium text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-brand-400" />
            <span>{title}</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Copy output"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code / Logs View */}
      <pre
        ref={terminalRef}
        style={{ maxHeight }}
        className="p-4 text-xs text-slate-300 overflow-auto whitespace-pre font-mono leading-relaxed selection:bg-brand-500 selection:text-white"
      >
        {logs || '// No logs recorded yet...'}
      </pre>
    </div>
  );
};
