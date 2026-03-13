import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';

type QuoteMap = Record<string, string[]>;
type EmptyQuote = { text: string; sub: string };

let cachedQuotes: QuoteMap | null = null;
let fetchPromise: Promise<QuoteMap> | null = null;

function parseQuotesMarkdown(body: string): QuoteMap {
  const map: QuoteMap = {};
  let section = '';

  for (const line of body.split('\n')) {
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      section = headerMatch[1].trim();
      continue;
    }
    // Skip blank lines, markdown table headers, and the intro paragraph
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('|') || trimmed.startsWith('---')) continue;
    if (!section) continue;

    if (!map[section]) map[section] = [];
    map[section].push(trimmed);
  }

  return map;
}

function loadQuotes(): Promise<QuoteMap> {
  if (cachedQuotes) return Promise.resolve(cachedQuotes);
  if (fetchPromise) return fetchPromise;

  fetchPromise = api.search('', 'tk-quotes')
    .then(entries => {
      if (entries.length > 0) {
        cachedQuotes = parseQuotesMarkdown(entries[0].body);
      } else {
        cachedQuotes = {};
      }
      return cachedQuotes;
    })
    .catch(() => {
      cachedQuotes = {};
      return cachedQuotes;
    });

  return fetchPromise;
}

export function useQuotes(section: string): string[] {
  const [quotes, setQuotes] = useState<string[]>(() => {
    if (cachedQuotes) return cachedQuotes[section] || [];
    return [];
  });

  useEffect(() => {
    loadQuotes().then(map => {
      setQuotes(map[section] || []);
    });
  }, [section]);

  return quotes;
}

export function useRandomQuote(section: string, fallback: string): string {
  const quotes = useQuotes(section);
  return useMemo(() => {
    if (quotes.length === 0) return fallback;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [quotes, fallback]);
}

export function useEmptyQuotes(section: string, fallback: EmptyQuote[]): EmptyQuote[] {
  const quotes = useQuotes(section);
  return useMemo(() => {
    if (quotes.length === 0) return fallback;
    return quotes.map(line => {
      const [text, sub] = line.split('|').map(s => s.trim());
      return { text: text || line, sub: sub || '' };
    });
  }, [quotes, fallback]);
}

// Pre-fetch on module load so quotes are ready before components mount
loadQuotes();
