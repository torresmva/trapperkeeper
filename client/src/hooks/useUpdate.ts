import { useState, useEffect, useCallback } from 'react';

interface VersionInfo {
  version: string;
  commit: string;
  buildDate: string;
  branch: string;
  updateConfigured: boolean;
  dockerSocket: boolean;
  provider: string;
}

interface UpdateCheck {
  current: string;
  latest: string;
  latestTag: string;
  updateAvailable: boolean;
  releaseDate: string;
  changelog: string;
  releaseUrl: string;
}

interface UpdateConfig {
  provider: string;
  apiUrl: string;
  repo: string;
  image: string;
  hasToken: boolean;
  composePath: string;
  dockerSocket: boolean;
  dockerCLI: boolean;
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'pulling' | 'restarting' | 'up-to-date' | 'error' | 'unconfigured';

export function useUpdate() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [check, setCheck] = useState<UpdateCheck | null>(null);
  const [config, setConfig] = useState<UpdateConfig | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pullMessage, setPullMessage] = useState<string | null>(null);

  // Fetch current version on mount
  useEffect(() => {
    fetch('/api/update/version')
      .then(r => r.json())
      .then(data => {
        setVersion(data);
        if (!data.updateConfigured) setStatus('unconfigured');
      })
      .catch(() => {});
  }, []);

  const checkForUpdate = useCallback(async () => {
    setStatus('checking');
    setError(null);
    try {
      const res = await fetch('/api/update/check');
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error);
        setStatus('error');
        return;
      }
      setCheck(data);
      setStatus(data.updateAvailable ? 'available' : 'up-to-date');
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  const applyUpdate = useCallback(async (tag?: string) => {
    setStatus('pulling');
    setError(null);
    setPullMessage(null);
    try {
      const res = await fetch('/api/update/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error);
        if (data.manual) setPullMessage(data.manual);
        setStatus('error');
        return;
      }
      if (data.restarting) {
        setStatus('restarting');
        // Poll until server comes back
        const poll = setInterval(async () => {
          try {
            const r = await fetch('/api/update/version');
            if (r.ok) {
              clearInterval(poll);
              window.location.reload();
            }
          } catch {
            // still restarting
          }
        }, 3000);
        // Give up after 2 minutes
        setTimeout(() => clearInterval(poll), 120000);
      } else {
        setPullMessage(data.manual || data.message);
        setStatus('available'); // still needs manual restart
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/update/config');
      const data = await res.json();
      setConfig(data);
    } catch {
      // ignore
    }
  }, []);

  return {
    version,
    check,
    config,
    status,
    error,
    pullMessage,
    checkForUpdate,
    applyUpdate,
    fetchConfig,
  };
}
