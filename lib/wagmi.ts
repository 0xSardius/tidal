import { http, fallback } from 'wagmi';
import { base, baseSepolia, arbitrum, optimism } from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';

export const wagmiConfig = createConfig({
  chains: [base, arbitrum, optimism, baseSepolia],
  transports: {
    [base.id]: fallback([
      http('https://mainnet.base.org'),
      http('https://base.meowrpc.com'),
    ]),
    [arbitrum.id]: fallback([
      http('https://arb1.arbitrum.io/rpc'),
      http('https://arbitrum.meowrpc.com'),
    ]),
    [optimism.id]: fallback([
      http('https://mainnet.optimism.io'),
      http('https://optimism.meowrpc.com'),
    ]),
    [baseSepolia.id]: fallback([
      http('https://sepolia.base.org'),
    ]),
  },
});
