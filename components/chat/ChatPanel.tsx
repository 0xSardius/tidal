'use client';

import dynamic from 'next/dynamic';

// Dynamically import ChatPanelContent to avoid SSR hydration issues
// The hooks (useAccount, useChat, etc.) cause state updates during render
const ChatPanelContent = dynamic(
  () => import('./ChatPanelContent').then((mod) => mod.ChatPanelContent),
  {
    ssr: false,
    loading: () => <ChatPanelSkeleton />,
  }
);

export function ChatPanel() {
  return <ChatPanelContent />;
}

function ChatPanelSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/5">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-4 w-48 bg-slate-800/50 rounded animate-pulse mt-1" />
      </div>
      <div className="flex-1 p-6">
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
