'use client';

import dynamic from 'next/dynamic';

const TransactionHistory = dynamic(
  () => import('@/components/dashboard/TransactionHistory').then((mod) => mod.TransactionHistory),
  { ssr: false }
);

export default function HistoryPage() {
  return <TransactionHistory />;
}
