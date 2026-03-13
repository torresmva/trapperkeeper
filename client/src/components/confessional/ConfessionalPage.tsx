import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { ConfessionalEntry } from '../../types';
import { PixelLock, PixelBorder, PixelGhost } from '../shared/PixelArt';

// Web Crypto helpers — all encryption/decryption happens client-side
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase) as BufferSource, 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptText(plaintext: string, passphrase: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(plaintext) as BufferSource
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
  };
}

async function decryptText(ciphertext: string, iv: string, salt: string, passphrase: string): Promise<string> {
  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const cipherBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const key = await deriveKey(passphrase, saltBytes);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as BufferSource },
    key,
    cipherBytes as BufferSource
  );
  return new TextDecoder().decode(decrypted);
}

interface DecryptedEntry {
  id: string;
  content: string;
  hint?: string;
  created: string;
  modified: string;
}

export function ConfessionalPage() {
  const [entries, setEntries] = useState<ConfessionalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [decrypted, setDecrypted] = useState<DecryptedEntry[]>([]);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newHint, setNewHint] = useState('');

  const loadEntries = useCallback(async () => {
    try {
      const data = await api.listConfessional();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleUnlock = async () => {
    if (!passphrase) return;
    setError('');
    try {
      if (!crypto.subtle) {
        setError('encryption requires HTTPS or localhost — crypto.subtle is not available');
        return;
      }
      if (entries.length === 0) {
        // No entries yet — just unlock to allow creating
        setDecrypted([]);
        setUnlocked(true);
        return;
      }
      const results: DecryptedEntry[] = [];
      for (const entry of entries) {
        try {
          const content = await decryptText(entry.ciphertext, entry.iv, entry.salt, passphrase);
          results.push({
            id: entry.id,
            content,
            hint: entry.hint,
            created: entry.created,
            modified: entry.modified,
          });
        } catch {
          results.push({
            id: entry.id,
            content: '[encrypted — different passphrase]',
            hint: entry.hint,
            created: entry.created,
            modified: entry.modified,
          });
        }
      }
      setDecrypted(results);
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'decryption failed — are you on HTTPS?');
    }
  };

  const handleAdd = async () => {
    if (!newContent.trim() || !passphrase) return;
    setError('');
    try {
      if (!crypto.subtle) {
        setError('encryption requires HTTPS or localhost — crypto.subtle is not available');
        return;
      }
      const encrypted = await encryptText(newContent, passphrase);
      await api.createConfessional({
        ...encrypted,
        hint: newHint.trim() || undefined,
      });
      setNewContent('');
      setNewHint('');
      setShowAdd(false);
      await loadEntries();
      // Re-decrypt with current passphrase
      const data = await api.listConfessional();
      const results: DecryptedEntry[] = [];
      for (const entry of data) {
        try {
          const content = await decryptText(entry.ciphertext, entry.iv, entry.salt, passphrase);
          results.push({ id: entry.id, content, hint: entry.hint, created: entry.created, modified: entry.modified });
        } catch {
          results.push({ id: entry.id, content: '[encrypted — different passphrase]', hint: entry.hint, created: entry.created, modified: entry.modified });
        }
      }
      setDecrypted(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'encryption failed — are you on HTTPS?');
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteConfessional(id);
    setDecrypted(prev => prev.filter(e => e.id !== id));
    loadEntries();
  };

  const handleLock = () => {
    setUnlocked(false);
    setDecrypted([]);
    setPassphrase('');
    setShowAdd(false);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PixelLock size={20} color="var(--accent-secondary)" />
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            the confessional
          </h1>
          {unlocked && (
            <button onClick={handleLock} style={{
              color: 'var(--accent-secondary)',
              fontSize: '11px',
              padding: '4px 10px',
              border: '1px solid var(--accent-secondary)',
              background: 'transparent',
              cursor: 'pointer',
            }}>
              lock
            </button>
          )}
        </div>
        <div style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: 4,
          fontStyle: 'italic',
          opacity: 0.6,
          paddingLeft: 32,
        }}>
          {unlocked
            ? 'your secrets are safe here. encrypted client-side, unreadable everywhere else.'
            : 'i will keep you in a jar beside my bed'
          }
        </div>
      </div>

      {/* Lock screen */}
      {!unlocked && (
        <div style={{
          padding: '48px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          <PixelLock size={48} color="var(--accent-secondary)" />
          <p style={{
            fontSize: '13px',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginTop: 8,
          }}>
            {entries.length > 0
              ? `${entries.length} sealed ${entries.length === 1 ? 'entry' : 'entries'}`
              : 'nothing here yet'
            }
          </p>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            maxWidth: 300,
            textAlign: 'center',
          }}>
            {entries.length > 0
              ? 'enter your passphrase to unlock. entries are encrypted with AES-256-GCM — the server never sees your plaintext.'
              : 'enter a passphrase to start. this will encrypt your entries with AES-256-GCM — the server never sees your plaintext.'}
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input
              type="password"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              placeholder="passphrase"
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--accent-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                padding: '8px 0',
                outline: 'none',
                fontFamily: "'JetBrains Mono', monospace",
                width: 200,
                textAlign: 'center',
              }}
            />
            <button
              onClick={handleUnlock}
              disabled={!passphrase}
              style={{
                background: 'transparent',
                border: '1px solid var(--accent-secondary)',
                color: 'var(--accent-secondary)',
                fontSize: 11,
                cursor: 'pointer',
                padding: '6px 14px',
              }}
            >
              {entries.length > 0 ? 'unlock' : 'start'}
            </button>
          </div>
          {error && (
            <p style={{ fontSize: '11px', color: 'var(--accent-tertiary)' }}>{error}</p>
          )}
        </div>
      )}

      {/* Unlocked view */}
      {unlocked && (
        <>
          {/* Add button */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowAdd(!showAdd)}
              style={{
                color: 'var(--accent-secondary)',
                fontSize: '11px',
                padding: '4px 10px',
                border: '1px solid var(--accent-secondary)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              + confess
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div style={{
              marginBottom: 24,
              padding: '16px',
              border: '1px solid var(--accent-secondary)',
              background: 'var(--bg-surface)',
              animation: 'fadeIn 0.15s ease',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  autoFocus
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="write what you need to get off your chest..."
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    padding: '8px 0',
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                    minHeight: 100,
                    resize: 'vertical',
                    lineHeight: 1.6,
                  }}
                />
                <input
                  value={newHint}
                  onChange={e => setNewHint(e.target.value)}
                  placeholder="hint (optional, stored in plaintext)"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    padding: '8px 0',
                    outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.5 }}>
                  encrypted with your current passphrase. use the same one to read it later.
                </div>
                {error && (
                  <p style={{ fontSize: '11px', color: 'var(--danger, var(--accent-tertiary))' }}>{error}</p>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowAdd(false); setError(''); }} style={cancelBtn}>cancel</button>
                  <button onClick={handleAdd} disabled={!newContent.trim()} style={{
                    background: 'transparent',
                    border: '1px solid var(--accent-secondary)',
                    color: 'var(--accent-secondary)',
                    fontSize: 11,
                    cursor: 'pointer',
                    padding: '6px 14px',
                  }}>
                    seal it
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Entry list */}
          {decrypted.length === 0 ? (
            <div style={{ padding: '48px 0', color: 'var(--text-muted)', textAlign: 'center' }}>
              <PixelGhost size={24} color="var(--accent-secondary)" />
              <p style={{ fontSize: '11px', marginTop: 12, fontStyle: 'italic' }}>
                nothing confessed yet. your secrets are waiting.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {decrypted.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    borderLeft: '2px solid var(--accent-secondary)',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px 4px',
                  }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', flex: 1 }}>
                      {new Date(entry.created).toLocaleDateString()} {new Date(entry.created).toLocaleTimeString()}
                    </span>
                    {entry.hint && (
                      <span style={{
                        fontSize: '9px',
                        color: 'var(--accent-secondary)',
                        opacity: 0.6,
                        fontStyle: 'italic',
                      }}>
                        {entry.hint}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: 10,
                        cursor: 'pointer',
                        opacity: 0.4,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      del
                    </button>
                  </div>
                  <div style={{
                    padding: '8px 12px 12px',
                    fontSize: '12px',
                    color: entry.content.startsWith('[encrypted')
                      ? 'var(--text-muted)'
                      : 'var(--text-primary)',
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    fontStyle: entry.content.startsWith('[encrypted') ? 'italic' : 'normal',
                    opacity: entry.content.startsWith('[encrypted') ? 0.5 : 1,
                  }}>
                    {entry.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <PixelBorder />
      </div>
    </div>
  );
}

const cancelBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: 11,
  cursor: 'pointer',
  padding: '6px 12px',
};
