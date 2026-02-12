import { http, fallback } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: fallback([
      http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
      http('https://sepolia.base.org'),
    ]),
    [base.id]: fallback([
      http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || 'https://mainnet.base.org'),
      http('https://mainnet.base.org'),
      http('https://base.meowrpc.com'),
    ]),
  },
});
