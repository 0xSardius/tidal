import { PoolList } from '@/components/sidebar/PoolList';
import { PortfolioPanelWrapper } from '@/components/dashboard/PortfolioPanelWrapper';
import { PortfolioProvider } from '@/lib/contexts/PortfolioContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortfolioProvider>
      <div className="h-screen flex tidal-bg tidal-caustics">
        {/* Left Sidebar - Pool Navigation */}
        <aside className="w-60 flex-shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-sm">
          <PoolList />
        </aside>

        {/* Center - Main Content (Chat) */}
        <main className="flex-1 flex flex-col min-w-0 border-r border-white/5">
          {children}
        </main>

        {/* Right Sidebar - Portfolio Dashboard */}
        <aside className="w-80 flex-shrink-0 bg-black/20 backdrop-blur-sm hidden lg:block">
          <PortfolioPanelWrapper />
        </aside>
      </div>
    </PortfolioProvider>
  );
}
