"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import DashboardCard from "@/components/DashboardCard";
import { getStats } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await getStats());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <Navbar title="Overview" />
      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error} — set the admin password (top right) and retry.
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : stats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard label="Requests Today" value={stats.requests_today} accent />
            <DashboardCard label="Total Requests" value={stats.total_requests} />
            <DashboardCard
              label="Average Latency"
              value={`${stats.average_latency_ms} ms`}
            />
            <DashboardCard label="Active API Keys" value={stats.active_keys} />
            <DashboardCard
              label="Tokens Today"
              value={stats.total_tokens_today.toLocaleString()}
            />
            <DashboardCard
              label="Fake Spend Today"
              value={`$${stats.fake_spend_today.toFixed(6)}`}
            />
            <DashboardCard
              label="Failed Requests"
              value={stats.failed_requests_today}
            />
          </div>
        ) : null}

        <button
          onClick={load}
          className="mt-6 rounded-lg border border-surface-border bg-surface-card px-4 py-2 text-sm text-slate-300 transition hover:border-accent/50"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
