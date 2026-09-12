export function RouteDiagram() {
  const origins = [
    { label: 'ETH · Base', color: '#0052FF' },
    { label: 'USDT · Arbitrum', color: '#28A0F0' },
    { label: 'DAI · Ethereum', color: '#F5AC37' },
    { label: 'AVAX · Avalanche', color: '#E84142' },
  ];

  return (
    <div className="surface relative mt-14 overflow-hidden p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -left-16 -top-24 h-80 w-80"
        style={{ background: 'radial-gradient(circle, rgba(0,89,255,0.12), transparent 70%)' }}
      />
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-y-2">
        {origins.map((o) => (
          <div key={o.label} className="my-1 flex items-center">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3.5 py-2 font-mono text-xs font-medium shadow-soft">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: o.color }} />
              {o.label}
            </div>
            <div className="relative mx-1.5 hidden h-px w-6 bg-[linear-gradient(to_right,rgba(0,0,0,0.12)_50%,transparent_0%)] bg-[length:8px_1px] bg-repeat-x sm:block md:w-8">
              <span className="absolute -top-2 right-0 text-xs text-ink-faint">›</span>
            </div>
          </div>
        ))}
        <div className="my-1 flex items-center gap-2.5 rounded-2xl bg-ink px-5 py-3 font-mono text-xs font-semibold text-white shadow-lift md:text-sm">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue" />
          USDC on Polygon
        </div>
      </div>
      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 font-mono text-[11px] text-ink-soft">
        <span>Polygon Open Money Stack</span>
        <span>Trails Solver Engine</span>
        <span>Circle CCTP Settlement</span>
      </div>
    </div>
  );
}
