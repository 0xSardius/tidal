import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, getGreeting, buildWelcomeMessage } from '../ai/prompts';

// --- getGreeting ---

describe('getGreeting', () => {
  it('returns a string', () => {
    const greeting = getGreeting();
    expect(typeof greeting).toBe('string');
    expect(greeting.length).toBeGreaterThan(0);
  });

  it('returns one of the expected greetings', () => {
    const greeting = getGreeting();
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
  });
});

// --- buildWelcomeMessage ---

describe('buildWelcomeMessage', () => {
  it('returns Shallows welcome with correct content', () => {
    const msg = buildWelcomeMessage('shallows');
    expect(msg).toContain('Shallows');
    expect(msg).toContain('calm');
    expect(msg).toContain('Tidal');
    expect(msg).toContain('AAVE');
    expect(msg).toContain('Morpho');
  });

  it('returns Mid-Depth welcome with correct content', () => {
    const msg = buildWelcomeMessage('mid-depth');
    expect(msg).toContain('Mid-Depth');
    expect(msg).toContain('reward-boosted');
    expect(msg).toContain('yields');
  });

  it('returns Deep Water welcome with cross-chain mention', () => {
    const msg = buildWelcomeMessage('deep-water');
    expect(msg).toContain('Deep Water');
    expect(msg).toContain('all chains');
    expect(msg).toContain('Arbitrum');
    expect(msg).toContain('Solana');
  });

  it('includes a greeting in each welcome', () => {
    const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
    for (const depth of ['shallows', 'mid-depth', 'deep-water'] as const) {
      const msg = buildWelcomeMessage(depth);
      expect(greetings.some(g => msg.includes(g))).toBe(true);
    }
  });

  it('Deep Water mentions multi-step strategies', () => {
    const msg = buildWelcomeMessage('deep-water');
    expect(msg).toContain('swap + deposit');
  });

  it('Shallows mentions safe harbors', () => {
    const msg = buildWelcomeMessage('shallows');
    expect(msg).toContain('safe harbors');
  });
});

// --- buildSystemPrompt ---

describe('buildSystemPrompt', () => {
  const baseContext = {
    riskDepth: 'shallows' as const,
    walletConnected: true,
  };

  it('includes user risk depth', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt).toContain('Shallows');
    expect(prompt).toContain('Conservative');
  });

  it('includes wallet status', () => {
    const connected = buildSystemPrompt({ ...baseContext, walletConnected: true });
    expect(connected).toContain('Connected');

    const disconnected = buildSystemPrompt({ ...baseContext, walletConnected: false });
    expect(disconnected).toContain('Not connected');
  });

  it('includes positions when provided', () => {
    const prompt = buildSystemPrompt({
      ...baseContext,
      positions: [
        { token: 'USDC', amount: '1000', protocol: 'AAVE V3' },
      ],
    });
    expect(prompt).toContain('1000');
    expect(prompt).toContain('USDC');
    expect(prompt).toContain('AAVE V3');
  });

  it('shows no positions when none exist', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt).toContain('No active positions');
  });

  it('includes multi-chain scanning section', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt).toContain('Multi-Chain Yield Scanning');
    expect(prompt).toContain('6 chains');
    expect(prompt).toContain('Arbitrum');
    expect(prompt).toContain('Solana');
  });

  it('includes Li.Fi mention', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt).toContain('Li.Fi');
  });

  it('includes ocean metaphors section', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt).toContain('ocean terms');
  });

  it('includes tool descriptions', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt).toContain('scanYields');
    expect(prompt).toContain('getQuote');
    expect(prompt).toContain('prepareSupply');
    expect(prompt).toContain('prepareVaultDeposit');
  });

  it('includes tier-specific behavior for each depth', () => {
    const shallows = buildSystemPrompt({ riskDepth: 'shallows', walletConnected: true });
    expect(shallows).toContain('Shallows (Conservative)');
    expect(shallows).toContain('stablecoins');

    const midDepth = buildSystemPrompt({ riskDepth: 'mid-depth', walletConnected: true });
    expect(midDepth).toContain('Mid-Depth (Moderate)');
    expect(midDepth).toContain('YO Protocol');

    const deepWater = buildSystemPrompt({ riskDepth: 'deep-water', walletConnected: true });
    expect(deepWater).toContain('Deep Water (Aggressive)');
    expect(deepWater).toContain('maxRisk=3');
  });

  it('mentions cross-chain in Mid-Depth and Deep Water sections', () => {
    const midDepth = buildSystemPrompt({ riskDepth: 'mid-depth', walletConnected: true });
    expect(midDepth).toContain('other chains');

    const deepWater = buildSystemPrompt({ riskDepth: 'deep-water', walletConnected: true });
    expect(deepWater).toContain('cross-chain');
  });

  it('includes strategies context', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt).toContain('Available Strategies');
  });

  it('includes Base-only execution note', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt).toContain('Only Base yields are currently executable');
  });

  it('includes dollar-to-token conversion warning', () => {
    const prompt = buildSystemPrompt(baseContext);
    expect(prompt).toContain('TOKEN units');
    expect(prompt).toContain('dollar');
  });
});
