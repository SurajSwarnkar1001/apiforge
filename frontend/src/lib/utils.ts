import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { HttpMethod, ConfidenceLevel, LoadTestStatus, ScanStatus } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMethodBg(method: HttpMethod): string {
  switch (method) {
    case 'GET':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'POST':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'PUT':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'PATCH':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'DELETE':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'HEAD':
    case 'OPTIONS':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
}

export function getMethodSolidColor(method: HttpMethod): string {
  switch (method) {
    case 'GET':
      return '#10B981';
    case 'POST':
      return '#3B82F6';
    case 'PUT':
      return '#F59E0B';
    case 'PATCH':
      return '#8B5CF6';
    case 'DELETE':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

export function getConfidenceBadge(confidence: ConfidenceLevel) {
  switch (confidence) {
    case 'HIGH':
      return {
        label: 'High Confidence (OpenAPI)',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
      };
    case 'MEDIUM':
      return {
        label: 'Medium Confidence (Observed Traffic)',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        dotClass: 'bg-blue-400',
      };
    case 'LOW':
      return {
        label: 'Low Confidence (JS Bundle Candidate)',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dotClass: 'bg-amber-400',
      };
  }
}

export function getStatusBadge(status: LoadTestStatus | ScanStatus) {
  switch (status) {
    case 'RUNNING':
      return {
        label: 'Running',
        badgeClass: 'bg-brand-500/10 text-brand-400 border-brand-500/30 animate-pulse',
        dotClass: 'bg-brand-400',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
      };
    case 'STOPPED':
      return {
        label: 'Stopped',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dotClass: 'bg-amber-400',
      };
    case 'FAILED':
      return {
        label: 'Failed',
        badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
        dotClass: 'bg-red-400',
      };
    case 'QUEUED':
    case 'PENDING':
    default:
      return {
        label: 'Queued',
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        dotClass: 'bg-slate-400',
      };
  }
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
