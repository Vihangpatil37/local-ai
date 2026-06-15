"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import LogsTable from "@/components/LogsTable";
import { getLogs } from "@/lib/api";
import type { UsageLog } from "@/lib/types";

const LIMIT = 20;

export default function LogsPage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getLogs({
        page,
        limit: LIMIT,
        status: status || undefined,
        model: model || undefined,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [page, status, model]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <Navbar title="Logs" />
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent"
          >
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
          <input
            value={model}
            onChange={(e) => {
              setPage(1);
              setModel(e.target.value);
            }}
            placeholder="Filter by model"
            className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent"
          />
          <button
            onClick={load}
            className="rounded-lg border border-surface-border bg-surface-card px-4 py-2 text-sm text-slate-300 hover:border-accent/50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <>
            <LogsTable logs={logs} />
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <span>{total} total requests</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-surface-border px-3 py-1.5 disabled:opacity-40"
                >
                  Prev
                </button>
                <span>
                  Page {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-surface-border px-3 py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
