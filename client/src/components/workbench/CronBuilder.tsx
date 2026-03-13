import { useState, useMemo } from 'react';

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '16px',
  padding: '8px 0',
  width: '100%',
  outline: 'none',
  letterSpacing: '0.1em',
};

const labelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 4,
  fontWeight: 600,
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  textAlign: 'center' as const,
};

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const PRESETS = [
  { label: 'every minute', cron: '* * * * *' },
  { label: 'every 5 minutes', cron: '*/5 * * * *' },
  { label: 'every 15 minutes', cron: '*/15 * * * *' },
  { label: 'every hour', cron: '0 * * * *' },
  { label: 'every 6 hours', cron: '0 */6 * * *' },
  { label: 'daily midnight', cron: '0 0 * * *' },
  { label: 'daily 9am', cron: '0 9 * * *' },
  { label: 'weekdays 9am', cron: '0 9 * * 1-5' },
  { label: 'weekly sunday', cron: '0 0 * * 0' },
  { label: 'monthly 1st', cron: '0 0 1 * *' },
  { label: 'quarterly', cron: '0 0 1 1,4,7,10 *' },
  { label: 'yearly', cron: '0 0 1 1 *' },
];

interface ParsedField {
  raw: string;
  description: string;
  valid: boolean;
}

function parseField(value: string, min: number, max: number, names?: string[]): ParsedField {
  const v = value.trim();
  if (!v) return { raw: v, description: 'empty', valid: false };

  // Wildcard
  if (v === '*') return { raw: v, description: 'every', valid: true };

  // Step: */n
  const stepMatch = v.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const step = parseInt(stepMatch[1]);
    if (step < 1 || step > max) return { raw: v, description: 'invalid step', valid: false };
    return { raw: v, description: `every ${step}`, valid: true };
  }

  // Range: n-m
  const rangeMatch = v.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1]), b = parseInt(rangeMatch[2]);
    if (a < min || b > max || a > b) return { raw: v, description: 'invalid range', valid: false };
    const aName = names ? names[a] || String(a) : String(a);
    const bName = names ? names[b] || String(b) : String(b);
    return { raw: v, description: `${aName} through ${bName}`, valid: true };
  }

  // Range with step: n-m/s
  const rangeStepMatch = v.match(/^(\d+)-(\d+)\/(\d+)$/);
  if (rangeStepMatch) {
    const a = parseInt(rangeStepMatch[1]), b = parseInt(rangeStepMatch[2]), s = parseInt(rangeStepMatch[3]);
    if (a < min || b > max || a > b || s < 1) return { raw: v, description: 'invalid', valid: false };
    return { raw: v, description: `every ${s} from ${a}-${b}`, valid: true };
  }

  // List: n,m,o
  const parts = v.split(',');
  const allValid = parts.every(p => {
    const n = parseInt(p.trim());
    return !isNaN(n) && n >= min && n <= max;
  });
  if (allValid && parts.length > 1) {
    const named = parts.map(p => {
      const n = parseInt(p.trim());
      return names ? names[n] || String(n) : String(n);
    });
    return { raw: v, description: named.join(', '), valid: true };
  }

  // Single value
  const single = parseInt(v);
  if (!isNaN(single) && single >= min && single <= max) {
    const name = names ? names[single] || String(single) : String(single);
    return { raw: v, description: `at ${name}`, valid: true };
  }

  return { raw: v, description: 'invalid', valid: false };
}

function describeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 'need exactly 5 fields';

  const [minute, hour, dom, month, dow] = parts;

  // Common patterns with natural language
  if (expr === '* * * * *') return 'runs every minute';
  if (expr === '0 * * * *') return 'runs at the top of every hour';
  if (expr === '0 0 * * *') return 'runs daily at midnight';
  if (expr === '0 0 1 * *') return 'runs on the 1st of every month at midnight';
  if (expr === '0 0 1 1 *') return 'runs once a year on January 1st at midnight';

  const pieces: string[] = [];

  // Minute
  if (minute === '*') pieces.push('every minute');
  else if (minute.startsWith('*/')) pieces.push(`every ${minute.slice(2)} minutes`);
  else pieces.push(`at minute ${minute}`);

  // Hour
  if (hour === '*') { /* already covered */ }
  else if (hour.startsWith('*/')) pieces.push(`every ${hour.slice(2)} hours`);
  else {
    const h = parseInt(hour);
    if (!isNaN(h)) {
      const ampm = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
      pieces.push(`past ${ampm}`);
    } else {
      pieces.push(`hour ${hour}`);
    }
  }

  // Day of month
  if (dom !== '*') {
    if (dom.startsWith('*/')) pieces.push(`every ${dom.slice(2)} days`);
    else pieces.push(`on day ${dom}`);
  }

  // Month
  if (month !== '*') {
    const monthNames = month.split(',').map(m => {
      const n = parseInt(m) - 1;
      return MONTHS[n] || m;
    });
    pieces.push(`in ${monthNames.join(', ')}`);
  }

  // Day of week
  if (dow !== '*') {
    if (dow === '1-5') pieces.push('on weekdays');
    else if (dow === '0,6') pieces.push('on weekends');
    else {
      const dayNames = dow.split(',').map(d => {
        const rangeMatch = d.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
          return `${DAYS[parseInt(rangeMatch[1])] || rangeMatch[1]}-${DAYS[parseInt(rangeMatch[2])] || rangeMatch[2]}`;
        }
        const n = parseInt(d);
        return DAYS[n] || d;
      });
      pieces.push(`on ${dayNames.join(', ')}`);
    }
  }

  return pieces.join(' ');
}

function getNextRuns(expr: string, count: number): Date[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];

  const results: Date[] = [];
  const now = new Date();
  const check = new Date(now);
  check.setSeconds(0, 0);
  check.setMinutes(check.getMinutes() + 1);

  const maxIter = 525600; // 1 year of minutes
  for (let i = 0; i < maxIter && results.length < count; i++) {
    if (matchesCron(check, parts)) {
      results.push(new Date(check));
    }
    check.setMinutes(check.getMinutes() + 1);
  }
  return results;
}

function matchesCron(date: Date, parts: string[]): boolean {
  const [minP, hourP, domP, monP, dowP] = parts;
  return (
    matchesField(date.getMinutes(), minP, 0, 59) &&
    matchesField(date.getHours(), hourP, 0, 23) &&
    matchesField(date.getDate(), domP, 1, 31) &&
    matchesField(date.getMonth() + 1, monP, 1, 12) &&
    matchesField(date.getDay(), dowP, 0, 7)
  );
}

function matchesField(value: number, pattern: string, min: number, max: number): boolean {
  if (pattern === '*') return true;

  return pattern.split(',').some(part => {
    // Step
    const stepMatch = part.match(/^(\*|\d+-\d+)\/(\d+)$/);
    if (stepMatch) {
      const step = parseInt(stepMatch[2]);
      if (stepMatch[1] === '*') return value % step === 0;
      const [a, b] = stepMatch[1].split('-').map(Number);
      return value >= a && value <= b && (value - a) % step === 0;
    }
    // Range
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1]), b = parseInt(rangeMatch[2]);
      return value >= a && value <= b;
    }
    // Single
    const n = parseInt(part);
    if (!isNaN(n)) {
      // Day of week: 7 = 0 (Sunday)
      if (max === 7 && n === 7) return value === 0;
      return value === n;
    }
    return false;
  });
}

export function CronBuilder() {
  const [cron, setCron] = useState('0 9 * * 1-5');

  const parts = cron.trim().split(/\s+/);
  const fields = useMemo(() => {
    if (parts.length !== 5) return null;
    return {
      minute: parseField(parts[0], 0, 59),
      hour: parseField(parts[1], 0, 23),
      dom: parseField(parts[2], 1, 31),
      month: parseField(parts[3], 1, 12, ['', ...MONTHS]),
      dow: parseField(parts[4], 0, 7, DAYS),
    };
  }, [cron]);

  const description = useMemo(() => describeCron(cron), [cron]);
  const nextRuns = useMemo(() => getNextRuns(cron, 5), [cron]);

  const allValid = fields && Object.values(fields).every(f => f.valid);

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Expression input */}
      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>cron expression</div>
        <input
          type="text"
          value={cron}
          onChange={e => setCron(e.target.value)}
          style={inputStyle}
          placeholder="* * * * *"
          spellCheck={false}
        />
      </div>

      {/* Field labels */}
      {fields && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          marginBottom: 20,
          padding: '0 0 12px',
          borderBottom: '1px solid var(--border)',
        }}>
          {[
            { label: 'minute', f: fields.minute, range: '0-59' },
            { label: 'hour', f: fields.hour, range: '0-23' },
            { label: 'day/month', f: fields.dom, range: '1-31' },
            { label: 'month', f: fields.month, range: '1-12' },
            { label: 'day/week', f: fields.dow, range: '0-7' },
          ].map(({ label, f, range }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={fieldLabelStyle}>{label}</div>
              <div style={{
                fontSize: '14px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                color: f.valid ? 'var(--accent-primary)' : 'var(--danger)',
                marginTop: 4,
              }}>
                {f.raw || '-'}
              </div>
              <div style={{
                fontSize: '10px',
                color: f.valid ? 'var(--text-secondary)' : 'var(--danger)',
                marginTop: 2,
              }}>
                {f.description}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 2 }}>{range}</div>
            </div>
          ))}
        </div>
      )}

      {/* Human description */}
      {allValid && (
        <div style={{
          borderLeft: '2px solid var(--accent-primary)',
          padding: '8px 16px',
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {description}
          </div>
        </div>
      )}

      {/* Next runs */}
      {allValid && nextRuns.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>next runs</div>
          {nextRuns.map((d, i) => (
            <div key={i} style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              color: i === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span>{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}

      {/* Presets */}
      <div>
        <div style={{ ...labelStyle, marginBottom: 8 }}>presets</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PRESETS.map(p => (
            <button
              key={p.cron}
              onClick={() => setCron(p.cron)}
              style={{
                background: cron === p.cron ? 'var(--accent-primary)' : 'transparent',
                color: cron === p.cron ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: `1px solid ${cron === p.cron ? 'var(--accent-primary)' : 'var(--border)'}`,
                padding: '4px 10px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
