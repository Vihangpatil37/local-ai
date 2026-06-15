"use client";

import type { ApiKey } from "@/lib/types";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function ApiKeyTable({
  keys,
  onDisable,
  onDelete,
}: {
  keys: ApiKey[];
  onDisable: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (keys.length === 0) {
    return (
      <p className="rounded-xl border border-surface-border bg-surface-card p-6 text-sm text-slate-400">
        No API keys yet. Create one to let a friend connect.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-surface-muted text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Key</th>
            <th className="px-4 py-3 font-medium">Requests</th>
            <th className="px-4 py-3 font-medium">Tokens</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Last used</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border bg-surface-card">
          {keys.map((k) => (
            <tr key={k.id}>
              <td className="px-4 py-3 text-slate-200">{k.name}</td>
              <td className="px-4 py-3 font-mono text-slate-400">
                {k.key_prefix}****
              </td>
              <td className="px-4 py-3 text-slate-300">{k.requests_count}</td>
              <td className="px-4 py-3 text-slate-300">
                {k.total_tokens.toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    k.active
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-slate-500/15 text-slate-400"
                  }`}
                >
                  {k.active ? "active" : "disabled"}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-400">
                {formatDate(k.last_used_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onDisable(k.id)}
                    disabled={!k.active}
                    className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-muted disabled:opacity-40"
                  >
                    Disable
                  </button>
                  <button
                    onClick={() => onDelete(k.id)}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
