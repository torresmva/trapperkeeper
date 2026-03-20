import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';

// ── Built-in fallback slogans ──

const BUILTIN_SLOGANS = [
  'write it down',
  'capture everything',
  'stdout > \/dev\/journal',
  'practice your politics',
  'receipts on file',
  'ink is permanent',
  'ctrl+s your brain',
  'the daily record',
  'dayman... fighter of the nightman',


];

// ── Slogans cache ──

let cachedSlogans: string[] | null = null;
let sloganPromise: Promise<string[]> | null = null;

function loadSlogans(): Promise<string[]> {
  if (cachedSlogans) return Promise.resolve(cachedSlogans);
  if (sloganPromise) return sloganPromise;

  sloganPromise = api.getSlogans()
    .then(res => {
      cachedSlogans = res.slogans.length > 0 ? res.slogans : null;
      return cachedSlogans || [];
    })
    .catch(() => {
      cachedSlogans = null;
      return [];
    });

  return sloganPromise;
}

export function invalidateSlogansCache() {
  cachedSlogans = null;
  sloganPromise = null;
}

// ── Hooks ──

export function useRotatingQuote(): string {
  const [userSlogans, setUserSlogans] = useState<string[]>(() => cachedSlogans || []);
  const [counter, setCounter] = useState(() => Math.floor(Math.random() * 100));

  useEffect(() => {
    loadSlogans().then(s => { if (s.length > 0) setUserSlogans(s); });
  }, []);

  useEffect(() => {
    const bump = () => setCounter(c => c + 1);
    window.addEventListener('popstate', bump);
    window.addEventListener('tk-file-change', bump);
    window.addEventListener('tk-nav', bump);
    const interval = setInterval(bump, 30000);
    return () => {
      window.removeEventListener('popstate', bump);
      window.removeEventListener('tk-file-change', bump);
      window.removeEventListener('tk-nav', bump);
      clearInterval(interval);
    };
  }, []);

  const pool = userSlogans.length > 0 ? userSlogans : BUILTIN_SLOGANS;
  return pool[counter % pool.length];
}

// ── Legacy hooks (used for flavor text throughout the app) ──

export function useRandomQuote(_section: string, fallback: string): string {
  return useMemo(() => fallback, [fallback]);
}

type EmptyQuote = { text: string; sub: string };

export function useEmptyQuotes(_section: string, fallback: EmptyQuote[]): EmptyQuote[] {
  return useMemo(() => fallback, [fallback]);
}

// Pre-fetch on module load
loadSlogans();
