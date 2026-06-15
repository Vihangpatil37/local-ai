"use client";

import type { UsageLog } from "@/lib/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default function LogsTable({ logs }: { logs: UsageLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="rounded-xl border border-surface-border bg-surface-card p-6 text-sm text-slate-400">
        No logs match the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-surface-muted text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Key</th>
            <th className="px-4 py-3 font-medium">Model</th>
            <th className="px-4 py-3 font-medium">Prompt</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Latency</th>
            <th className="px-4 py-3 font-medium">Tokens</th>
            <th className="px-4 py-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border bg-surface-card">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 text-slate-200">
                {log.api_key_name ?? "—"}
              </td>
              <td className="px-4 py-3 font-mono text-slate-300">{log.model}</td>
              <td className="max-w-[240px] truncate px-4 py-3 text-slate-400">
                {log.prompt_preview ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    log.status === "success"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {log.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-300">{log.latency_ms} ms</td>
              <td className="px-4 py-3 text-slate-300">
                {log.total_tokens}
                <span className="ml-1 text-xs text-slate-500">
                  ({log.prompt_tokens}/{log.completion_tokens})
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400">
                {formatDate(log.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
