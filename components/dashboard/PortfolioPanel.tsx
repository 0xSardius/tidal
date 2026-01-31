'use client';

interface Position {
  id: string;
  protocol: string;
  asset: string;
  value: number;
  apy: number;
  icon: string;
}

const mockPositions: Position[] = [
  { id: '1', protocol: 'AAVE', asset: 'USDC', value: 2093, apy: 3.8, icon: '🏛️' },
  { id: '2', protocol: 'Yearn', asset: 'USDC', value: 3141, apy: 4.2, icon: '🔷' },
];

export function PortfolioPanel() {
  const totalValue = mockPositions.reduce((sum, p) => sum + p.value, 0);
  const avgApy = mockPositions.reduce((sum, p) => sum + p.apy * p.value, 0) / totalValue;
  const dailyYield = (totalValue * avgApy) / 100 / 365;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Your Pool
        </div>
      </div>

      {/* Total Value */}
      <div className="p-4 border-b border-white/5">
        <div className="text-xs text-slate-500 mb-1">Total Value</div>
        <div className="text-3xl font-bold tracking-tight text-slate-100">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            +${dailyYield.toFixed(2)}/day
          </span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-400">{avgApy.toFixed(2)}% APY</span>
        </div>
      </div>

      {/* Allocation Visual */}
      <div className="p-4 border-b border-white/5">
        <div className="text-xs text-slate-500 mb-3">Allocation</div>
        <div className="h-3 rounded-full overflow-hidden bg-white/5 flex">
          {mockPositions.map((position, i) => {
            const width = (position.value / totalValue) * 100;
            const colors = ['bg-cyan-500', 'bg-teal-500', 'bg-blue-500'];
            return (
              <div
                key={position.id}
                className={`${colors[i % colors.length]} transition-all duration-500`}
                style={{ width: `${width}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs">
          {mockPositions.map((position, i) => {
            const colors = ['text-cyan-400', 'text-teal-400', 'text-blue-400'];
            const pct = ((position.value / totalValue) * 100).toFixed(0);
            return (
              <span key={position.id} className={`flex items-center gap-1 ${colors[i % colors.length]}`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {position.protocol} {pct}%
              </span>
            );
          })}
        </div>
      </div>

      {/* Positions */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs text-slate-500 mb-3">Active Positions</div>
        <div className="space-y-2">
          {mockPositions.map((position) => (
            <div
              key={position.id}
              className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{position.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {position.protocol}
                    </div>
                    <div className="text-xs text-slate-500">{position.asset}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-slate-200">
                    ${position.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-400">{position.apy}% APY</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ocean Conditions */}
      <div className="p-4 border-t border-white/5">
        <div className="text-xs text-slate-500 mb-2">Ocean Conditions</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-slate-500">Gas</div>
            <div className="text-slate-300 font-mono">~0.001 ETH</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <div className="text-slate-500">Base APY Range</div>
            <div className="text-emerald-400 font-mono">3.2-5.8%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
