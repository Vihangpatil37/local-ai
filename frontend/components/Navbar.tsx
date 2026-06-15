"use client";

import { useEffect, useState } from "react";
import { getAdminPassword, setAdminPassword } from "@/lib/api";

/** Top bar with the admin-password control used to authenticate dashboard calls. */
export default function Navbar({ title }: { title: string }) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(getAdminPassword());
  }, []);

  function save() {
    setAdminPassword(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    // Trigger a refresh so pages refetch with the new password.
    window.location.reload();
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border bg-surface-card/40 px-6 py-4">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Admin password"
          className="w-44 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-accent"
        />
        <button
          onClick={save}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-soft"
        >
          {saved ? "Saved" : "Set"}
        </button>
      </div>
    </header>
  );
}
