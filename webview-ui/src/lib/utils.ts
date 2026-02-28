import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtTime(ts: string): string {
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

export function fileIcon(type: string): string {
  return type === 'tfstate' ? '💾' : type === 'plan' ? '📋' : '📄';
}

export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function totalResources(files: any[]): number {
  return files.reduce((a: number, f: any) => a + f.resources.length, 0);
}

export function postVsCodeMessage(command: string, data?: Record<string, any>) {
  try {
    const vscode = (window as any).__vscode__;
    if (vscode) vscode.postMessage({ command, ...data });
  } catch (_) {}
}
