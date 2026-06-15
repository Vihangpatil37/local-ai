"use client";

import { useEffect, useRef, useState } from "react";
import { sendChat } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const API_KEY_STORAGE = "ollama_dashboard_user_api_key";

export default function ChatBox() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("llama3");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(API_KEY_STORAGE);
    if (stored) setApiKey(stored);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function persistKey(value: string) {
    setApiKey(value);
    window.localStorage.setItem(API_KEY_STORAGE, value);
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    if (!apiKey.trim()) {
      setError("Enter your API key first.");
      return;
    }

    setError("");
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChat(apiKey.trim(), model.trim() || "llama3", nextMessages);
      const reply = res.choices?.[0]?.message?.content ?? "(no response)";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-3xl flex-col gap-4 p-4">
      {/* Controls */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-surface-border bg-surface-card p-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => persistKey(e.target.value)}
            placeholder="sk-ollama-..."
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Model</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="llama3"
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-surface-border bg-surface-card/40 p-4">
        {messages.length === 0 && !loading && (
          <p className="mt-10 text-center text-sm text-slate-500">
            Start the conversation — your message is proxied to the owner&apos;s
            local Ollama model.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-accent text-white"
                  : "border border-surface-border bg-surface text-slate-200"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-surface-border bg-surface px-4 py-2.5 text-sm text-slate-400">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Type a message…  (Enter to send, Shift+Enter for newline)"
          className="flex-1 resize-none rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-slate-200 outline-none focus:border-accent"
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-soft disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
