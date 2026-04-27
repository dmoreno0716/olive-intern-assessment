export default function TokensSmokeTest() {
  return (
    <main className="min-h-screen p-12 space-y-10">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Smoke test — delete after verification
      </p>

      <section className="space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Studio mode (default — :root)
        </p>
        <h1 className="font-display text-5xl text-foreground">
          The quick brown fox
        </h1>
        <button
          type="button"
          className="rounded-md bg-primary px-5 py-2.5 text-primary-foreground font-medium shadow-1 transition hover:opacity-90"
        >
          Studio button
        </button>
      </section>

      <section className="funnel space-y-4 rounded-xl bg-background p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Funnel mode (.funnel scope)
        </p>
        <h1 className="font-display italic text-5xl text-foreground">
          The quick brown fox
        </h1>
        <button
          type="button"
          className="bg-primary px-5 py-2.5 text-primary-foreground font-medium shadow-2 transition hover:opacity-90"
          style={{ borderRadius: 18 }}
        >
          Funnel button
        </button>
      </section>
    </main>
  );
}
