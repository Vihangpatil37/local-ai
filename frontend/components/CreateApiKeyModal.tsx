"use client";

import { useState } from "react";
import { createKey } from "@/lib/api";
import type { CreatedApiKey } from "@/lib/types";

export default function CreateApiKeyModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const key = await createKey(name.trim() || "Unnamed key");
      setCreated(key);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setName("");
    setCreated(null);
    setError("");
    setCopied(false);
    onClose();
  }

  async function copy() {
    if (!created) return;
    await navigator.clipboard.writeText(created.full_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-6">
        {!created ? (
          <>
            <h2 className="text-lg font-semibold text-white">Create API Key</h2>
            <p className="mt-1 text-sm text-slate-400">
              Give the key a name so you remember who it&apos;s for.
            </p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Friend Laptop"
              className="mt-4 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-slate-200 outline-none focus:border-accent"
            />
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={close}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm text-slate-300 hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-soft disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-white">Key created</h2>
            <p className="mt-1 text-sm text-amber-400">
              Copy it now — this is the only time the full key is shown.
            </p>
            <div className="mt-4 break-all rounded-lg border border-surface-border bg-surface px-3 py-3 font-mono text-sm text-emerald-300">
              {created.full_key}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={copy}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm text-slate-200 hover:bg-surface-muted"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={close}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-soft"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
