export default function WorkspaceOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Workspace Overview</h1>
        <p className="text-slate-400 mt-1">
          Connected repositories, indexing freshness, and recent code intelligence activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="text-sm font-medium text-slate-400">Connected Repositories</div>
          <div className="text-3xl font-bold text-slate-100 mt-2">1</div>
          <div className="text-xs text-emerald-400 mt-1">All snapshots validated</div>
        </div>
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="text-sm font-medium text-slate-400">Indexed Code Chunks</div>
          <div className="text-3xl font-bold text-slate-100 mt-2">1,420</div>
          <div className="text-xs text-slate-400 mt-1">pgvector + full-text search active</div>
        </div>
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="text-sm font-medium text-slate-400">Indexed Commit SHA</div>
          <div className="text-2xl font-mono text-slate-100 mt-2 truncate">e5b38d8f</div>
          <div className="text-xs text-blue-400 mt-1">v1.0.0 pipeline</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Repositories</h2>
        <div className="divide-y divide-slate-800">
          <div className="py-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-200">acme/payment-service</div>
              <div className="text-sm text-slate-400">Default branch: <span className="font-mono text-slate-300">main</span></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                READY
              </span>
              <a
                href="/chat?repo=00000000-0000-0000-0000-000000000004"
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                Ask Questions
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

