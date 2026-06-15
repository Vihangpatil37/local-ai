"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ApiKeyTable from "@/components/ApiKeyTable";
import CreateApiKeyModal from "@/components/CreateApiKeyModal";
import { deleteKey, disableKey, listKeys } from "@/lib/api";
import type { ApiKey } from "@/lib/types";

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setKeys(await listKeys());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDisable(id: number) {
    try {
      await disableKey(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disable key");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this key? It will be disabled and can no longer be used.")) {
      return;
    }
    try {
      await deleteKey(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete key");
    }
  }

  return (
    <div>
      <Navbar title="API Keys" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Create a key per friend/device. The full key is shown only once.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-soft"
          >
            + New Key
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
          <ApiKeyTable
            keys={keys}
            onDisable={handleDisable}
            onDelete={handleDelete}
          />
        )}
      </div>

      <CreateApiKeyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={load}
      />
    </div>
  );
}
