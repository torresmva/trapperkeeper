import { useState, useEffect, useCallback, useRef } from 'react';

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
  imageTag: string;
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
  wardenAvailable: boolean;
}

interface RollbackInfo {
  available: boolean;
  previousImage?: string;
  previousVersion?: string;
  newImage?: string;
  timestamp?: string;
}

export type UpdateStatus =
  | 'idle' | 'checking' | 'available' | 'pulling'
  | 'restarting' | 'verifying' | 'restart-timeout' | 'restart-failed'
  | 'up-to-date' | 'error' | 'unconfigured';

export function useUpdate() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [check, setCheck] = useState<UpdateCheck | null>(null);
  const [config, setConfig] = useState<UpdateConfig | null>(null);
  const [rollback, setRollback] = useState<RollbackInfo | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pullMessage, setPullMessage] = useState<string | null>(null);
  const [restartElapsed, setRestartElapsed] = useState(0);
  const pollRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/update/version')
      .then(r => r.json())
      .then(data => {
        setVersion(data);
        if (!data.updateConfigured) setStatus('unconfigured');
      })
      .catch(() => {});
  }, []);

  const clearPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => clearPolling, [clearPolling]);

  const checkForUpdate = useCallback(async () => {
    setStatus('checking');
    setError(null);
    setErrorCode(null);
    try {
      const res = await fetch('/api/update/check');
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error);
        setErrorCode(data.error || null);
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
    setErrorCode(null);
    setPullMessage(null);

    const expectedVersion = tag?.replace(/^v/, '') || undefined;

    try {
      const res = await fetch('/api/update/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error);
        setErrorCode(data.error || null);
        if (data.manual) setPullMessage(data.manual);
        setStatus('error');
        return;
      }

      if (data.restarting) {
        setStatus('restarting');
        setRestartElapsed(0);

        // Elapsed timer
        timerRef.current = window.setInterval(() => {
          setRestartElapsed(prev => prev + 1);
        }, 1000);

        // Health polling — patient, waits for new version
        let sawDown = false;
        pollRef.current = window.setInterval(async () => {
          try {
            const r = await fetch('/api/update/health');
            if (r.ok) {
              const health = await r.json();
              if (health.ok) {
                if (expectedVersion && health.version === expectedVersion) {
                  // New version is up
                  clearPolling();
                  setStatus('verifying');
                  // Brief pause to let server fully initialize
                  setTimeout(() => window.location.reload(), 2000);
                } else if (!expectedVersion && sawDown) {
                  // No expected version but server came back after being down
                  clearPolling();
                  setTimeout(() => window.location.reload(), 2000);
                } else if (expectedVersion && health.version !== expectedVersion && health.uptime > 30 && sawDown) {
                  // Server came back but wrong version after 30s — something went wrong
                  clearPolling();
                  setStatus('restart-failed');
                  setError(`server restarted but still running v${health.version}`);
                  fetchRollback();
                }
                // else: still waiting for restart to happen
              }
            }
          } catch {
            // server is down — this is expected during restart
            sawDown = true;
            setStatus('restarting');
          }
        }, 3000);

        // Timeout after 2 minutes
        setTimeout(() => {
          if (pollRef.current) {
            clearPolling();
            setStatus('restart-timeout');
            setError('server did not respond after 2 minutes');
            setPullMessage('docker compose up -d');
          }
        }, 120000);
      } else {
        setPullMessage(data.manual || data.message);
        setStatus('available');
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }, [clearPolling]);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/update/config');
      setConfig(await res.json());
    } catch {}
  }, []);

  const fetchRollback = useCallback(async () => {
    try {
      const res = await fetch('/api/update/rollback');
      setRollback(await res.json());
    } catch {}
  }, []);

  const applyRollback = useCallback(async () => {
    setStatus('restarting');
    setError(null);
    setRestartElapsed(0);
    try {
      const res = await fetch('/api/update/rollback', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error);
        setErrorCode(data.error || null);
        if (data.manual) setPullMessage(data.manual);
        setStatus('error');
        return;
      }

      // Poll for restart
      timerRef.current = window.setInterval(() => {
        setRestartElapsed(prev => prev + 1);
      }, 1000);

      pollRef.current = window.setInterval(async () => {
        try {
          const r = await fetch('/api/update/health');
          if (r.ok) {
            clearPolling();
            window.location.reload();
          }
        } catch {}
      }, 3000);

      setTimeout(() => {
        if (pollRef.current) {
          clearPolling();
          setStatus('restart-timeout');
          setError('server did not respond after rollback');
        }
      }, 120000);
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  }, [clearPolling]);

  return {
    version, check, config, rollback,
    status, error, errorCode, pullMessage, restartElapsed,
    checkForUpdate, applyUpdate, fetchConfig, fetchRollback, applyRollback,
  };
}
