import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-card px-4 py-1.5 text-sm text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Powered by your own laptop
        </span>

        <h1 className="text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Private Local AI,
          <br />
          <span className="bg-gradient-to-r from-accent-soft to-indigo-300 bg-clip-text text-transparent">
            accessible anywhere
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          The model runs on the owner&apos;s machine using Ollama. Friends connect
          through a secure backend proxy — no API costs, no sharing your GPU,
          full usage logging and key management.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/chat"
            className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/30 transition hover:bg-accent-soft"
          >
            Open Chat
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-surface-border bg-surface-card px-6 py-3 font-semibold text-slate-200 transition hover:border-accent/50"
          >
            Open Dashboard
          </Link>
        </div>

        <div className="mt-20 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: "Secure proxy",
              body: "Requests are validated by API key before reaching Ollama.",
            },
            {
              title: "Full visibility",
              body: "Latency, tokens, models, and status logged per request.",
            },
            {
              title: "Key management",
              body: "Create, disable, and revoke keys from the dashboard.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-surface-border bg-surface-card/60 p-6 text-left"
            >
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
