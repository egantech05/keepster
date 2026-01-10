import React, { useCallback } from 'react';
import { HomeScreen } from '../features/home/HomeScreen';
import { SessionScreen } from '../features/session/SessionScreen';
import { SessionSummaryScreen } from '../features/session/SessionSummaryScreen';
import { useSessionStore } from '../features/session/sessionStore';

export function RootNavigator() {
  const { state, startSession, resetSession } = useSessionStore();

  const handleStart = useCallback(() => {
    startSession();
  }, [startSession]);

  const handleRestart = useCallback(() => {
    startSession();
  }, [startSession]);

  if (state.status === 'running') {
    return <SessionScreen />;
  }

  if (state.status === 'summary') {
    return <SessionSummaryScreen onStartAnother={handleRestart} onBackHome={resetSession} />;
  }

  return <HomeScreen onStart={handleStart} />;
}
