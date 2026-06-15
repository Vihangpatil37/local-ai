"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import DashboardCard from "@/components/DashboardCard";
import { getUsage } from "@/lib/api";
import type { UsageSummary } from "@/lib/types";

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsage(await getUsage());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load usage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const maxTokens =
    usage?.by_key.reduce((m, k) => Math.max(m, k.total_tokens), 0) || 1;

  return (
    <div>
      <Navbar title="Usage" />
      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : usage ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardCard
                label="Total Tokens"
                value={usage.total_tokens.toLocaleString()}
                accent
              />
              <DashboardCard label="Total Requests" value={usage.total_requests} />
              <DashboardCard label="Requests Today" value={usage.requests_today} />
              <DashboardCard
                label="Fake Spend"
                value={`$${usage.fake_spend.toFixed(6)}`}
              />
            </div>

            <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Usage by API key
            </h2>
            <div className="space-y-3">
              {usage.by_key.length === 0 && (
                <p className="text-sm text-slate-500">No usage recorded yet.</p>
              )}
              {usage.by_key.map((k) => (
                <div
                  key={`${k.api_key_id}-${k.api_key_name}`}
                  className="rounded-xl border border-surface-border bg-surface-card p-4"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">
                      {k.api_key_name ?? "Unknown / deleted key"}
                    </span>
                    <span className="text-slate-400">
                      {k.requests} req · {k.total_tokens.toLocaleString()} tokens ·
                      ${k.fake_spend.toFixed(6)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${(k.total_tokens / maxTokens) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
