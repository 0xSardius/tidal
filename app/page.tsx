'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/hooks/useWallet';
import { useRiskDepth } from '@/lib/hooks/useRiskDepth';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import TheProcess from '@/components/landing/TheProcess';
import WhyTidal from '@/components/landing/WhyTidal';
import Footer from '@/components/landing/Footer';

export default function Home() {
  const router = useRouter();
  const { ready, authenticated } = useWallet();
  const { isLoaded, hasSelected } = useRiskDepth();

  // Redirect authenticated users
  useEffect(() => {
    if (ready && authenticated && isLoaded) {
      if (hasSelected) {
        router.push('/dashboard');
      } else {
        router.push('/onboard');
      }
    }
  }, [ready, authenticated, isLoaded, hasSelected, router]);

  return (
    <div data-theme="landing">
      <Header />
      <main>
        <Hero />
        <Features />
        <TheProcess />
        <WhyTidal />
      </main>
      <Footer />
    </div>
  );
}
