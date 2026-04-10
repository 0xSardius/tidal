import { JUPITER_BASE_URL, JUPITER_API_KEY, resolveMint, resolveSymbol } from './constants';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(JUPITER_API_KEY ? { 'x-api-key': JUPITER_API_KEY } : {}),
};

// --- Types ---

export interface SwapOrder {
  requestId: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RoutePlanStep[];
  transaction: string; // base64 encoded VersionedTransaction to sign
  totalFees?: {
    signatureFee: number;
    openOrdersFee: number;
    ataDeposits: number;
    totalFeeAndDepositsInSOL: number;
    minimumSOLForTransaction: number;
  };
}

interface RoutePlanStep {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface SwapExecution {
  status: 'Success' | 'Failed';
  signature?: string;
  error?: string;
  code?: number;
}

// --- API Calls ---

/** Get a swap order from Jupiter Ultra. Returns a transaction to sign. */
export async function getSwapOrder(params: {
  inputMint: string;
  outputMint: string;
  amount: string; // in smallest units (lamports, token units)
  taker: string; // wallet address
  slippageBps?: number;
}): Promise<SwapOrder> {
  const inputMint = resolveMint(params.inputMint).toBase58();
  const outputMint = resolveMint(params.outputMint).toBase58();

  const searchParams = new URLSearchParams({
    inputMint,
    outputMint,
    amount: params.amount,
    taker: params.taker,
  });
  if (params.slippageBps) {
    searchParams.set('slippageBps', params.slippageBps.toString());
  }

  const res = await fetch(
    `${JUPITER_BASE_URL}/ultra/v1/order?${searchParams}`,
    { headers },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jupiter order failed (${res.status}): ${body}`);
  }

  return res.json();
}

/** Execute a signed swap transaction via Jupiter Ultra. */
export async function executeSwap(params: {
  signedTransaction: string; // base64 encoded signed VersionedTransaction
  requestId: string;
}): Promise<SwapExecution> {
  const res = await fetch(`${JUPITER_BASE_URL}/ultra/v1/execute`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      signedTransaction: params.signedTransaction,
      requestId: params.requestId,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jupiter execute failed (${res.status}): ${body}`);
  }

  return res.json();
}

/** Format a swap order for display in the AI chat. */
export function formatSwapOrder(order: SwapOrder): {
  action: 'swap';
  protocol: 'jupiter';
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
  route: string[];
  slippageBps: number;
  requestId: string;
  transaction: string;
  fees: {
    totalSOL: number;
    minimumSOL: number;
  } | null;
  note: string;
} {
  const inputSymbol = resolveSymbol(order.inputMint);
  const outputSymbol = resolveSymbol(order.outputMint);
  const route = order.routePlan.map(step => step.swapInfo.label);

  return {
    action: 'swap',
    protocol: 'jupiter',
    inputToken: inputSymbol,
    outputToken: outputSymbol,
    inputAmount: order.inAmount,
    outputAmount: order.outAmount,
    priceImpact: order.priceImpactPct,
    route,
    slippageBps: order.slippageBps,
    requestId: order.requestId,
    transaction: order.transaction,
    fees: order.totalFees ? {
      totalSOL: order.totalFees.totalFeeAndDepositsInSOL,
      minimumSOL: order.totalFees.minimumSOLForTransaction,
    } : null,
    note: `Swap ${inputSymbol} → ${outputSymbol} via Jupiter (${route.join(' → ')})`,
  };
}
