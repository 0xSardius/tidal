'use client';

import { useState, useEffect, useCallback } from 'react';

export type AutonomyMode = 'supervised' | 'autopilot';

const STORAGE_KEY = 'tidal-autonomy';

export function useAutonomy() {
  const [mode, setModeState] = useState<AutonomyMode>('supervised');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'autopilot' || stored === 'supervised') {
      setModeState(stored);
    }
    setIsLoaded(true);
  }, []);

  const setMode = useCallback((newMode: AutonomyMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'supervised' ? 'autopilot' : 'supervised';
    setMode(newMode);
  }, [mode, setMode]);

  return {
    mode,
    setMode,
    toggleMode,
    isAutopilot: mode === 'autopilot',
    isLoaded,
  };
}
