import { ChatPanel } from '@/components/chat/ChatPanel';

// Force dynamic rendering - page uses client-side wagmi hooks
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <ChatPanel />;
}
