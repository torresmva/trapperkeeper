import { useState, useEffect, useRef } from 'react';

const QUIPS = [
  "shall we play a game?",
  "it's dangerous to go alone",
  "the cake is a lie",
  "would you kindly authenticate",
  "all your base are belong to us",
  "do a barrel roll",
  "hey! listen!",
  "war. war never changes.",
  "stay awhile and listen",
  "you must construct additional pylons",
  "a winner is you",
  "the password is not 'swordfish'",
  "I used to be an admin like you...",
  "select * from users where trust = true",
  "trust, but verify",
  "speak friend and enter",
];

const WRONG_QUIPS = [
  "game over, man! game over!",
  "you shall not pass!",
  "access denied, punk",
  "wrong. try again, hero.",
  "that's not it, chief",
  "nope. not even close.",
  "the princess is in another castle",
  "fatal error: bad password",
  "you died.",
  "fission mailed",
  "wasted.",
  "mission failed. we'll get 'em next time.",
];

// Pixel art skull (16x16)
const SKULL = [
  "  ████████████  ",
  " ██░░░░░░░░░░██ ",
  "██░░░░░░░░░░░░██",
  "██░░██░░░░██░░██",
  "██░░██░░░░██░░██",
  "██░░░░░░░░░░░░██",
  "██░░░░░██░░░░░██",
  " ██░░░░░░░░░░██ ",
  "  ██░░████░░██  ",
  "   ██░░░░░░██   ",
  "    ████████    ",
  "   ██░░░░░░██   ",
  "  ██░░░░░░░░██  ",
  "   ██████████   ",
];

// Pixel art key (16x8)
const KEY = [
  "        ████    ",
  "      ██░░░░██  ",
  "██████░░░░░░░░██",
  "░░░░░░██░░░░██  ",
  "██████░░████    ",
  "      ██        ",
];

// Pixel art lock (unlocked)
const LOCK_OPEN = [
  "    ░░████      ",
  "    ░░█  █      ",
  "    ░░█         ",
  "  ██████████    ",
  "  █░░░░░░░░█    ",
  "  █░░░██░░░█    ",
  "  █░░░██░░░█    ",
  "  █░░░░░░░░█    ",
  "  ██████████    ",
];

interface Props {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [quip] = useState(() => QUIPS[Math.floor(Math.random() * QUIPS.length)]);
  const [unlocked, setUnlocked] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setUnlocked(true);
        setTimeout(onLogin, 800);
      } else {
        setError(WRONG_QUIPS[Math.floor(Math.random() * WRONG_QUIPS.length)]);
        setShaking(true);
        setPassword('');
        setTimeout(() => setShaking(false), 500);
      }
    } catch {
      setError('connection failed');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'hidden',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* CRT vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      <div style={{
        position: 'relative',
        zIndex: 5,
        textAlign: 'center',
        maxWidth: 460,
        width: '100%',
        padding: '0 24px',
      }}>
        {/* Pixel art */}
        <div style={{
          marginBottom: 24,
          lineHeight: '8px',
          fontSize: '8px',
          letterSpacing: '0px',
          userSelect: 'none',
          transition: 'all 0.5s',
          opacity: unlocked ? 0.3 : 1,
        }}>
          <pre style={{
            fontFamily: 'monospace',
            color: unlocked ? '#4ade80' : '#22d3ee',
            margin: 0,
            display: 'inline-block',
            textShadow: unlocked
              ? '0 0 10px rgba(74, 222, 128, 0.8)'
              : '0 0 10px rgba(34, 211, 238, 0.5)',
            lineHeight: 1.1,
            fontSize: '7px',
          }}>
            {(unlocked ? LOCK_OPEN : (error ? SKULL : KEY)).map((line, i) => (
              <span key={i}>{line}{'\n'}</span>
            ))}
          </pre>
        </div>

        {/* Title */}
        <div style={{
          fontSize: '20px',
          fontWeight: 700,
          color: unlocked ? '#4ade80' : '#22d3ee',
          marginBottom: 4,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          textShadow: unlocked
            ? '0 0 20px rgba(74, 222, 128, 0.6)'
            : '0 0 20px rgba(34, 211, 238, 0.4)',
          transition: 'all 0.5s',
        }}>
          {unlocked ? '> access granted' : '> trapperkeeper'}
        </div>

        {/* Quip */}
        <div style={{
          fontSize: '11px',
          color: error ? '#f472b6' : 'rgba(255,255,255,0.3)',
          marginBottom: 32,
          minHeight: 16,
          transition: 'color 0.3s',
          textShadow: error ? '0 0 10px rgba(244, 114, 182, 0.4)' : 'none',
        }}>
          {error || quip}
        </div>

        {/* Password form */}
        {!unlocked && (
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              animation: shaking ? 'tk-shake 0.5s ease-in-out' : undefined,
            }}>
              <span style={{
                color: '#22d3ee',
                fontSize: '14px',
                marginRight: 8,
                textShadow: '0 0 8px rgba(34, 211, 238, 0.5)',
              }}>
                {'>'}_
              </span>
              <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${error ? '#f472b6' : '#22d3ee'}`,
                    color: '#22d3ee',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '16px',
                    padding: '8px 0',
                    width: '100%',
                    outline: 'none',
                    caretColor: 'transparent',
                    letterSpacing: '0.3em',
                    transition: 'border-color 0.3s',
                  }}
                  autoComplete="current-password"
                  spellCheck={false}
                  autoFocus
                />
                {/* Custom block cursor */}
                <div style={{
                  position: 'absolute',
                  bottom: 10,
                  left: `${password.length * 12.8}px`,
                  width: 10,
                  height: 18,
                  background: cursorVisible ? '#22d3ee' : 'transparent',
                  transition: 'left 0.05s',
                  pointerEvents: 'none',
                }} />
              </div>
            </div>

            <button
              type="submit"
              style={{
                background: 'transparent',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                color: '#22d3ee',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                padding: '8px 24px',
                cursor: 'pointer',
                marginTop: 24,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)';
                e.currentTarget.style.borderColor = '#22d3ee';
                e.currentTarget.style.textShadow = '0 0 8px rgba(34, 211, 238, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.3)';
                e.currentTarget.style.textShadow = 'none';
              }}
            >
              enter
            </button>
          </form>
        )}

        {/* Boot text at bottom */}
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '9px',
          color: 'rgba(255,255,255,0.12)',
          letterSpacing: '0.1em',
        }}>
          TK-OS v2.0 — {new Date().getFullYear()} — all systems nominal
        </div>
      </div>

      <style>{`
        @keyframes tk-shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-6px); }
          30%, 70% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
