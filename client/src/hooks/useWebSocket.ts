import { useEffect, useRef, useCallback } from 'react';

type WSMessage = { type: string; id: string };

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {}
    };

    ws.onclose = () => {
      setTimeout(() => {
        // Reconnect handled by component remount
      }, 3000);
    };

    wsRef.current = ws;
    return () => ws.close();
  }, []);

  return wsRef;
}
