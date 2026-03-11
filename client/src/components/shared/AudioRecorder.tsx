import { useState, useRef } from 'react';

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    '',  // browser default
  ];
  for (const type of types) {
    if (!type || MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

interface Props {
  onRecordingComplete: (url: string) => void;
}

type RecordMode = 'mic' | 'system';

export function AudioRecorder({ onRecordingComplete }: Props) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mode, setMode] = useState<RecordMode>('mic');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadBlob = async (blob: Blob, ext: string = 'webm') => {
    setUploading(true);
    const formData = new FormData();
    const filename = `recording-${Date.now()}.${ext}`;
    formData.append('file', blob, filename);
    try {
      const res = await fetch('/api/assets', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const url = data.url || `/api/assets/files/${data.filename}`;
      onRecordingComplete(url);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('upload failed');
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    setError('');

    // Check if MediaRecorder is available
    if (typeof MediaRecorder === 'undefined') {
      setError('recording not supported in this browser');
      return;
    }

    // Check if mediaDevices is available (requires HTTPS or localhost)
    if (!navigator.mediaDevices) {
      setError('requires HTTPS or localhost');
      return;
    }

    try {
      let stream: MediaStream;

      const mimeType = getSupportedMimeType();
      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) recorderOptions.mimeType = mimeType;

      if (mode === 'system') {
        if (!navigator.mediaDevices.getDisplayMedia) {
          setError('system audio not supported — use mic or upload');
          return;
        }
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: 1, height: 1, frameRate: 1 },
            audio: true,
          });
        } catch (displayErr: any) {
          if (displayErr.name === 'NotAllowedError') {
            setError('cancelled — try again or use mic mode');
          } else {
            setError('system audio not supported — use mic or upload');
          }
          return;
        }

        if (stream.getAudioTracks().length === 0) {
          stream.getTracks().forEach(t => t.stop());
          setError('no audio shared — check "share tab audio"');
          return;
        }

        const audioStream = new MediaStream(stream.getAudioTracks());
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(audioStream, recorderOptions);
        setupRecorder(mediaRecorder, stream, mimeType);
      } else {
        // Mic mode
        if (!navigator.mediaDevices.getUserMedia) {
          setError('mic not supported in this browser');
          return;
        }
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (micErr: any) {
          if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
            setError('mic permission denied — check browser settings');
          } else if (micErr.name === 'NotFoundError') {
            setError('no microphone found');
          } else if (micErr.name === 'NotReadableError') {
            setError('mic in use by another app');
          } else {
            console.error('Mic error:', micErr.name, micErr.message);
            setError(`mic error: ${micErr.name}`);
          }
          return;
        }
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, recorderOptions);
        setupRecorder(mediaRecorder, stream, mimeType);
      }
    } catch (err: any) {
      console.error('Recording failed:', err.name, err.message);
      setError(`failed: ${err.message || err.name}`);
    }
  };

  const setupRecorder = (mediaRecorder: MediaRecorder, stream: MediaStream, mimeType: string) => {
    mediaRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      // Stop ALL tracks (including video if system mode)
      stream.getTracks().forEach(t => t.stop());
      if (streamRef.current && streamRef.current !== stream) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      streamRef.current = null;

      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        await uploadBlob(blob);
      }
    };

    mediaRecorder.start(1000);
    setRecording(true);
    setDuration(0);
    timerRef.current = window.setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state === 'recording') {
      mediaRef.current.stop();
    }
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop() || 'webm';
    await uploadBlob(file, ext);
    e.target.value = '';
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {recording ? (
        <>
          <button
            onClick={stopRecording}
            style={{
              fontSize: '10px',
              color: 'var(--danger)',
              background: 'transparent',
              border: '1px solid var(--danger)',
              padding: '3px 10px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              animation: 'pulse 1.5s infinite',
            }}
          >
            ■ stop
          </button>
          <span style={{
            fontSize: '10px',
            color: 'var(--danger)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {mode === 'system' ? 'sys' : 'mic'} {formatTime(duration)}
          </span>
        </>
      ) : (
        <>
          {/* Mode toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border)' }}>
            {(['mic', 'system'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  fontSize: '9px',
                  color: mode === m ? 'var(--accent-secondary)' : 'var(--text-muted)',
                  background: 'transparent',
                  border: 'none',
                  borderRight: m === 'mic' ? '1px solid var(--border)' : 'none',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {m === 'system' ? 'sys' : 'mic'}
              </button>
            ))}
          </div>

          {/* Record button */}
          <button
            onClick={startRecording}
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid var(--border)',
              padding: '3px 10px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            title={mode === 'system' ? 'Record tab/app audio (share screen)' : 'Record from microphone'}
          >
            ● rec
          </button>

          {/* Upload audio file */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              fontSize: '10px',
              color: uploading ? 'var(--accent-tertiary)' : 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid var(--border)',
              padding: '3px 10px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (!uploading) e.currentTarget.style.color = 'var(--accent-secondary)'; }}
            onMouseLeave={e => { if (!uploading) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {uploading ? 'uploading...' : '↑ audio'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          {error && (
            <span style={{
              fontSize: '9px',
              color: 'var(--danger)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {error}
            </span>
          )}
        </>
      )}
    </div>
  );
}
