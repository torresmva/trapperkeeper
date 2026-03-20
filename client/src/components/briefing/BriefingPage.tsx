import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useRandomQuote } from '../../hooks/useQuotes';
import { PixelCoffee, PixelLightning, PixelScroll, PixelStar, PixelShield, PixelHeart } from '../shared/PixelArt';

// ── Weather codes → descriptions ──
const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'clear', icon: '☀' },
  1: { label: 'mostly clear', icon: '🌤' },
  2: { label: 'partly cloudy', icon: '⛅' },
  3: { label: 'overcast', icon: '☁' },
  45: { label: 'fog', icon: '🌫' },
  48: { label: 'rime fog', icon: '🌫' },
  51: { label: 'light drizzle', icon: '🌦' },
  53: { label: 'drizzle', icon: '🌦' },
  55: { label: 'heavy drizzle', icon: '🌧' },
  61: { label: 'light rain', icon: '🌧' },
  63: { label: 'rain', icon: '🌧' },
  65: { label: 'heavy rain', icon: '🌧' },
  71: { label: 'light snow', icon: '🌨' },
  73: { label: 'snow', icon: '❄' },
  75: { label: 'heavy snow', icon: '❄' },
  77: { label: 'snow grains', icon: '❄' },
  80: { label: 'rain showers', icon: '🌧' },
  81: { label: 'moderate showers', icon: '🌧' },
  82: { label: 'violent showers', icon: '⛈' },
  85: { label: 'snow showers', icon: '🌨' },
  86: { label: 'heavy snow showers', icon: '🌨' },
  95: { label: 'thunderstorm', icon: '⛈' },
  96: { label: 'thunderstorm + hail', icon: '⛈' },
  99: { label: 'severe thunderstorm', icon: '⛈' },
};

function weatherInfo(code: number) {
  return WMO_CODES[code] || { label: 'unknown', icon: '?' };
}

// ── Types ──
interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_probability_max: number[];
    time: string[];
  };
  city?: string;
  state?: string;
  country?: string;
}

interface NewsItem {
  title: string;
  link: string;
  source: string;
  points?: number;
  comments?: number;
}

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

interface OnThisDayEntry {
  label: string;
  date: string;
  entries: { id: string; title: string; type: string; category: string }[];
}

interface StatusItem {
  id: string;
  name: string;
  host: string;
  port?: number;
  type: string;
  up: boolean;
  latency: number;
  status?: number;
}

interface CalendarEvent {
  summary: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

// ── Section header ──
function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '10px',
      color: 'var(--text-muted)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      {icon}
      {children}
    </div>
  );
}

// ── Weather panel ──
function WeatherPanel({ data, loading, onRedetect }: { data: WeatherData | null; loading: boolean; onRedetect?: () => void }) {
  if (loading) return <PanelSkeleton label="weather" />;
  if (!data) return <PanelError label="weather" />;

  const current = data.current;
  const w = weatherInfo(current.weather_code);
  const daily = data.daily;

  const locationParts = [data.city, data.state, data.country].filter(Boolean).map(s => s!.toLowerCase());
  const locationStr = locationParts.join(', ');

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionLabel icon={<span style={{ fontSize: '12px' }}>{w.icon}</span>}>
          weather
        </SectionLabel>
        {onRedetect && (
          <button
            onClick={onRedetect}
            title="re-detect location"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
              padding: '2px 4px',
              letterSpacing: '0.04em',
            }}
          >
            ⟳ detect
          </button>
        )}
      </div>
      {locationStr && (
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.02em' }}>
          {locationStr}
        </div>
      )}

      {/* Current */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '32px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}>
          {Math.round(current.temperature_2m)}°
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          feels {Math.round(current.apparent_temperature)}°
        </span>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 12 }}>
        {w.label} · {Math.round(current.wind_speed_10m)} mph wind · {current.relative_humidity_2m}% humidity
      </div>

      {/* 3-day forecast */}
      <div style={{ display: 'flex', gap: 0 }}>
        {daily.time.map((day, i) => {
          const dw = weatherInfo(daily.weather_code[i]);
          const label = i === 0 ? 'today' : new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
          return (
            <div key={day} style={{
              flex: 1,
              padding: '8px 0',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
              borderRight: i < daily.time.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: '14px', marginBottom: 2 }}>{dw.icon}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
                {Math.round(daily.temperature_2m_max[i])}°
                <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>/</span>
                {Math.round(daily.temperature_2m_min[i])}°
              </div>
              {daily.precipitation_probability_max[i] > 0 && (
                <div style={{ fontSize: '9px', color: 'var(--accent-primary)', marginTop: 2 }}>
                  {daily.precipitation_probability_max[i]}% rain
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Markets panel ──
function MarketsPanel({ data, loading }: { data: MarketItem[]; loading: boolean }) {
  if (loading) return <PanelSkeleton label="markets" />;
  if (data.length === 0) return <PanelError label="markets" />;

  return (
    <div style={panelStyle}>
      <SectionLabel icon={<PixelLightning size={11} color="var(--accent-tertiary)" />}>markets</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {data.map(m => {
          const up = m.change >= 0;
          const color = up ? 'var(--accent-green)' : '#ef4444';
          return (
            <div key={m.symbol} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 0',
              borderBottom: '1px solid var(--border)',
              fontSize: '11px',
            }}>
              <span style={{ color: 'var(--text-muted)', width: 70, fontSize: '10px', flexShrink: 0 }}>
                {m.name}
              </span>
              <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>
                {m.price >= 1000 ? m.price.toLocaleString('en-US', { maximumFractionDigits: 0 }) :
                 m.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{
                color,
                width: 60,
                textAlign: 'right',
                fontSize: '10px',
                fontWeight: 500,
                flexShrink: 0,
              }}>
                {up ? '+' : ''}{m.changePct.toFixed(2)}%
              </span>
              <span style={{
                width: 6,
                height: 6,
                background: color,
                flexShrink: 0,
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── News panel ──
function NewsPanel({ items, loading, tab, setTab }: {
  items: NewsItem[];
  loading: boolean;
  tab: 'hn' | 'world' | 'reddit';
  setTab: (t: 'hn' | 'world' | 'reddit') => void;
}) {
  if (loading) return <PanelSkeleton label="headlines" />;

  const filtered = tab === 'hn'
    ? items.filter(i => i.source === 'HN')
    : tab === 'reddit'
    ? items.filter(i => i.source === 'r/networking')
    : items.filter(i => i.source !== 'HN' && i.source !== 'r/networking');

  const tabs: { key: 'hn' | 'world' | 'reddit'; label: string }[] = [
    { key: 'hn', label: 'hacker news' },
    { key: 'reddit', label: 'r/networking' },
    { key: 'world', label: 'world' },
  ];

  return (
    <div style={{ ...panelStyle, gridColumn: 'span 2' }} className="briefing-news-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <SectionLabel icon={<PixelScroll size={11} color="var(--accent-secondary)" />}>headlines</SectionLabel>
        <div style={{ display: 'flex', gap: 0, marginLeft: 'auto' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '3px 10px',
                fontSize: '9px',
                color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${tab === t.key ? 'var(--accent-primary)' : 'transparent'}`,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          no headlines available
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {filtered.slice(0, 10).map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
              textDecoration: 'none',
              borderBottomWidth: 1,
              color: 'inherit',
            }}
          >
            <span style={{
              color: 'var(--text-muted)',
              fontSize: '9px',
              width: 16,
              textAlign: 'right',
              flexShrink: 0,
              paddingTop: 2,
            }}>
              {i + 1}
            </span>
            <span style={{
              flex: 1,
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              {item.title}
            </span>
            {item.points !== undefined && (
              <span style={{
                fontSize: '9px',
                color: 'var(--accent-tertiary)',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}>
                {item.points}↑ · {item.comments}c
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── On This Day panel ──
function OnThisDayPanel({ data, loading }: { data: OnThisDayEntry[]; loading: boolean }) {
  const navigate = useNavigate();

  if (loading) return null;
  if (data.length === 0) return null;

  return (
    <div style={panelStyle}>
      <SectionLabel icon={<PixelScroll size={11} color="var(--accent-secondary)" />}>on this day</SectionLabel>
      {data.map(period => (
        <div key={period.label} style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: '9px',
            color: 'var(--accent-secondary)',
            marginBottom: 4,
            fontWeight: 600,
          }}>
            {period.label}
          </div>
          {period.entries.map(entry => (
            <div
              key={entry.id}
              onClick={() => navigate(`/${entry.category}/${entry.id}`)}
              style={{
                padding: '5px 0 5px 10px',
                borderLeft: '2px solid var(--border)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderLeftColor = 'var(--accent-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'var(--border)'; }}
            >
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginRight: 6, textTransform: 'uppercase' }}>
                {entry.type}
              </span>
              {entry.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Skeleton / Error ──
function PanelSkeleton({ label }: { label: string }) {
  return (
    <div style={panelStyle}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        animation: 'pulse 1.5s infinite',
      }}>
        loading...
      </div>
    </div>
  );
}

function PanelError({ label }: { label: string }) {
  return (
    <div style={panelStyle}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        unavailable
      </div>
    </div>
  );
}

// ── Panel wrapper style ──
const panelStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  padding: '16px',
  background: 'var(--bg-surface)',
  minWidth: 0,
};

// ── Date display ──
function DateHeader() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toLowerCase();

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--text-muted)',
        letterSpacing: '0.02em',
      }}>
        {day}
      </div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '11px',
        color: 'var(--text-muted)',
        opacity: 0.6,
      }}>
        {date}
      </div>
    </div>
  );
}

// ── Greeting line ──
function Greeting() {
  const hour = new Date().getHours();
  let greeting = 'good evening';
  if (hour < 12) greeting = 'good morning';
  else if (hour < 17) greeting = 'good afternoon';

  const quote = useRandomQuote('briefing', 'stay sharp.');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '1.4rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.04em',
      }}>
        {greeting}
      </span>
      <span style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
      }}>
        {quote}
      </span>
    </div>
  );
}

// ── Main BriefingPage ──
export function BriefingPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [onThisDay, setOnThisDay] = useState<OnThisDayEntry[]>([]);
  const [otdLoading, setOtdLoading] = useState(true);
  const [newsTab, setNewsTab] = useState<'hn' | 'world' | 'reddit'>('hn');
  const [services, setServices] = useState<StatusItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [calendar, setCalendar] = useState<{ events: CalendarEvent[]; tomorrow: CalendarEvent[]; configured: boolean; error?: string }>({ events: [], tomorrow: [], configured: false });
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Geolocation — try once, fall back to NYC
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(null);

  useEffect(() => {
    // Check localStorage first for saved location
    const saved = localStorage.getItem('tk-briefing-coords');
    if (saved) {
      try {
        setCoords(JSON.parse(saved));
        return;
      } catch {}
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: String(pos.coords.latitude), lon: String(pos.coords.longitude) };
          setCoords(c);
          localStorage.setItem('tk-briefing-coords', JSON.stringify(c));
        },
        () => setCoords({ lat: '40.7128', lon: '-74.0060' }),
        { timeout: 5000 }
      );
    } else {
      setCoords({ lat: '40.7128', lon: '-74.0060' });
    }
  }, []);

  const redetectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    localStorage.removeItem('tk-briefing-coords');
    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: String(pos.coords.latitude), lon: String(pos.coords.longitude) };
        localStorage.setItem('tk-briefing-coords', JSON.stringify(c));
        setCoords(c);
      },
      () => {},
      { timeout: 5000 }
    );
  }, []);

  // Fetch all data
  useEffect(() => {
    if (!coords) return;

    setWeatherLoading(true);
    fetch(`/api/briefing/weather?lat=${coords.lat}&lon=${coords.lon}`)
      .then(r => r.ok ? r.json() : null)
      .then(setWeather)
      .catch(() => setWeather(null))
      .finally(() => setWeatherLoading(false));

    setNewsLoading(true);
    fetch('/api/briefing/news')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setNews(d.items || []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));

    setMarketsLoading(true);
    fetch('/api/briefing/markets')
      .then(r => r.ok ? r.json() : { markets: [] })
      .then(d => setMarkets(d.markets || []))
      .catch(() => setMarkets([]))
      .finally(() => setMarketsLoading(false));

    setOtdLoading(true);
    api.getOnThisDay()
      .then(setOnThisDay)
      .catch(() => setOnThisDay([]))
      .finally(() => setOtdLoading(false));

    setServicesLoading(true);
    fetch('/api/briefing/status')
      .then(r => r.ok ? r.json() : { services: [] })
      .then(d => setServices(d.services || []))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));

    setCalendarLoading(true);
    fetch('/api/briefing/calendar')
      .then(r => r.ok ? r.json() : { events: [], tomorrow: [], configured: false })
      .then(setCalendar)
      .catch(() => setCalendar({ events: [], tomorrow: [], configured: false }))
      .finally(() => setCalendarLoading(false));
  }, [coords, lastRefresh]);

  const refresh = () => setLastRefresh(new Date());

  return (
    <div style={{ maxWidth: 900 }} className="briefing-page">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 16,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div>
          <Greeting />
          <DateHeader />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: '9px',
            color: 'var(--text-muted)',
            opacity: 0.5,
          }}>
            {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()}
          </span>
          <button
            onClick={refresh}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '10px',
              padding: '4px 10px',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            refresh
          </button>
        </div>
      </div>

      {/* Grid: 2 columns on desktop, 1 on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
      }} className="briefing-grid">
        {/* Row 1: Weather + Calendar side by side */}
        <WeatherPanel data={weather} loading={weatherLoading} onRedetect={redetectLocation} />
        <CalendarPanel data={calendar} loading={calendarLoading} onRefresh={refresh} />

        {/* Row 2: Markets + System Status */}
        <MarketsPanel data={markets} loading={marketsLoading} />
        <StatusPanel services={services} loading={servicesLoading} onRefresh={refresh} />

        {/* Row 3: News spans full width */}
        <NewsPanel items={news} loading={newsLoading} tab={newsTab} setTab={setNewsTab} />

        {/* Row 4: On This Day + Quote */}
        <OnThisDayPanel data={onThisDay} loading={otdLoading} />
        <QuotePanel />
      </div>
    </div>
  );
}

// ── System status panel ──
function StatusPanel({ services, loading, onRefresh }: { services: StatusItem[]; loading: boolean; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', host: '', port: '', type: 'http' as string, path: '' });

  if (loading) return <PanelSkeleton label="systems" />;

  const allUp = services.length > 0 && services.every(s => s.up);

  const handleAdd = async () => {
    if (!form.name || !form.host) return;
    await fetch('/api/briefing/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        host: form.host,
        port: form.port ? parseInt(form.port) : undefined,
        type: form.type,
        path: form.path || undefined,
      }),
    });
    setForm({ name: '', host: '', port: '', type: 'http', path: '' });
    setAdding(false);
    onRefresh();
  };

  const handleRemove = async (id: string) => {
    await fetch(`/api/briefing/services/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <SectionLabel icon={<PixelShield size={11} color={allUp ? 'var(--accent-green)' : '#ef4444'} />}>systems</SectionLabel>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {allUp && services.length > 0 && (
            <span style={{ fontSize: '9px', color: 'var(--accent-green)', letterSpacing: '0.06em' }}>
              ALL OK
            </span>
          )}
          <button
            onClick={() => setAdding(!adding)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              padding: '0 4px',
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>
      </div>

      {services.length === 0 && !adding && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          no services configured —{' '}
          <button
            onClick={() => setAdding(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: '11px',
              padding: 0,
              cursor: 'pointer',
              textTransform: 'lowercase',
              fontStyle: 'italic',
            }}
          >
            add one
          </button>
        </div>
      )}

      {services.map(svc => (
        <div key={svc.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 0',
          borderBottom: '1px solid var(--border)',
          fontSize: '11px',
        }}>
          <span style={{
            width: 6,
            height: 6,
            background: svc.up ? 'var(--accent-green)' : '#ef4444',
            flexShrink: 0,
            animation: svc.up ? 'none' : 'pulse 1.5s infinite',
          }} />
          <span style={{
            flex: 1,
            color: svc.up ? 'var(--text-secondary)' : '#ef4444',
          }}>
            {svc.name}
          </span>
          {svc.up && (
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              {svc.latency}ms
            </span>
          )}
          {!svc.up && (
            <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 500 }}>
              DOWN
            </span>
          )}
          <button
            onClick={() => handleRemove(svc.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '9px',
              padding: '0 2px',
              cursor: 'pointer',
              opacity: 0.4,
            }}
          >
            x
          </button>
        </div>
      ))}

      {adding && (
        <div style={{
          marginTop: 8,
          padding: '10px 0',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ flex: 1, fontSize: '11px', padding: '4px 0' }}
            />
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ width: 60, fontSize: '11px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}
            >
              <option value="http">http</option>
              <option value="https">https</option>
              <option value="tcp">tcp</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="host"
              value={form.host}
              onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
              style={{ flex: 1, fontSize: '11px', padding: '4px 0' }}
            />
            <input
              placeholder="port"
              value={form.port}
              onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
              style={{ width: 60, fontSize: '11px', padding: '4px 0' }}
            />
          </div>
          <input
            placeholder="path (optional, e.g. /health)"
            value={form.path}
            onChange={e => setForm(f => ({ ...f, path: e.target.value }))}
            style={{ fontSize: '11px', padding: '4px 0' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={handleAdd}
              style={{
                background: 'transparent',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-primary)',
                fontSize: '10px',
                padding: '4px 12px',
                cursor: 'pointer',
              }}
            >
              add
            </button>
            <button
              onClick={() => setAdding(false)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: '10px',
                padding: '4px 12px',
                cursor: 'pointer',
              }}
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Calendar panel ──
function CalendarPanel({ data, loading, onRefresh }: {
  data: { events: CalendarEvent[]; tomorrow: CalendarEvent[]; configured: boolean; error?: string };
  loading: boolean;
  onRefresh: () => void;
}) {
  const [configuring, setConfiguring] = useState(false);
  const [calUrl, setCalUrl] = useState('');
  const [calUser, setCalUser] = useState('');
  const [calPass, setCalPass] = useState('');
  const [showTomorrow, setShowTomorrow] = useState(false);
  const [loadedExisting, setLoadedExisting] = useState(false);

  if (loading) return <PanelSkeleton label="calendar" />;

  const openConfig = async () => {
    // Load existing config values so user sees what's saved
    if (!loadedExisting) {
      try {
        const res = await fetch('/api/briefing/calendar/config');
        const cfg = await res.json();
        if (cfg.url) setCalUrl(cfg.url);
        if (cfg.user) setCalUser(cfg.user);
        setLoadedExisting(true);
      } catch {}
    }
    setConfiguring(true);
  };

  const handleSave = async () => {
    const res = await fetch('/api/briefing/calendar/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: calUrl, user: calUser, pass: calPass }),
    });
    if (res.ok) {
      setConfiguring(false);
      setLoadedExisting(false);
      onRefresh();
    }
  };

  const events = showTomorrow ? data.tomorrow : data.events;
  const dayLabel = showTomorrow ? 'tomorrow' : 'today';

  if (!data.configured || configuring) {
    return (
      <div style={panelStyle}>
        <SectionLabel icon={<PixelHeart size={11} color="var(--accent-secondary)" />}>calendar</SectionLabel>
        {!configuring ? (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            no calendar configured —{' '}
            <button
              onClick={openConfig}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '11px',
                padding: 0,
                cursor: 'pointer',
                textTransform: 'lowercase',
                fontStyle: 'italic',
              }}
            >
              add ical url
            </button>
          </div>
        ) : (
          <CalendarConfigForm
            url={calUrl} user={calUser} pass={calPass}
            setUrl={setCalUrl} setUser={setCalUser} setPass={setCalPass}
            onSave={handleSave} onCancel={() => setConfiguring(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <SectionLabel icon={<PixelHeart size={11} color="var(--accent-secondary)" />}>calendar</SectionLabel>
        <div style={{ display: 'flex', gap: 0, marginLeft: 'auto' }}>
          {(['today', 'tomorrow'] as const).map(t => (
            <button
              key={t}
              onClick={() => setShowTomorrow(t === 'tomorrow')}
              style={{
                padding: '3px 8px',
                fontSize: '9px',
                color: dayLabel === t ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${dayLabel === t ? 'var(--accent-primary)' : 'transparent'}`,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
          <button
            onClick={openConfig}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '9px',
              padding: '3px 4px',
              cursor: 'pointer',
              opacity: 0.5,
            }}
          >
            cfg
          </button>
        </div>
      </div>

      {/* Error display */}
      {data.error && (
        <div style={{
          fontSize: '10px',
          color: '#ef4444',
          marginBottom: 8,
          padding: '6px 8px',
          borderLeft: '2px solid #ef4444',
        }}>
          {data.error === 'auth_failed' ? 'authentication failed — check username/app-specific password' :
           data.error === 'invalid_format' ? 'url did not return calendar data — check the url' :
           data.error === 'caldav_needs_auth' ? 'caldav urls require username + app-specific password' :
           data.error}
          {' — '}
          <button
            onClick={openConfig}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '10px', padding: 0, cursor: 'pointer', textDecoration: 'underline', textTransform: 'lowercase' }}
          >
            reconfigure
          </button>
        </div>
      )}

      {!data.error && events.length === 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          nothing on the calendar {dayLabel}
        </div>
      )}

      {events.map((evt, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '6px 0',
          borderBottom: '1px solid var(--border)',
          fontSize: '11px',
        }}>
          <span style={{
            color: evt.allDay ? 'var(--accent-secondary)' : 'var(--accent-primary)',
            fontSize: '10px',
            width: 58,
            flexShrink: 0,
            textAlign: 'right',
          }}>
            {evt.startTime}
          </span>
          <div style={{ flex: 1, borderLeft: '2px solid var(--border)', paddingLeft: 8 }}>
            <div style={{ color: 'var(--text-secondary)' }}>
              {evt.summary}
            </div>
            {evt.location && (
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 2 }}>
                {evt.location}
              </div>
            )}
            {evt.endTime && !evt.allDay && (
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: 1 }}>
                until {evt.endTime}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Calendar config form (shared) ──
function CalendarConfigForm({ url, user, pass, setUrl, setUser, setPass, onSave, onCancel }: {
  url: string; user: string; pass: string;
  setUrl: (v: string) => void; setUser: (v: string) => void; setPass: (v: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
        ical url (apple: icloud.com → calendar → share → public)
      </div>
      <input
        placeholder="https://p123-caldav.icloud.com/..."
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{ fontSize: '11px', padding: '4px 0' }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="username (apple id email)"
          value={user}
          onChange={e => setUser(e.target.value)}
          style={{ flex: 1, fontSize: '11px', padding: '4px 0' }}
        />
        <input
          type="password"
          placeholder="app-specific password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          style={{ flex: 1, fontSize: '11px', padding: '4px 0' }}
        />
      </div>
      <div style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.6 }}>
        generate an app-specific password at appleid.apple.com → sign-in & security
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button
          onClick={onSave}
          style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', fontSize: '10px', padding: '4px 12px', cursor: 'pointer' }}
        >
          save
        </button>
        <button
          onClick={onCancel}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '10px', padding: '4px 12px', cursor: 'pointer' }}
        >
          cancel
        </button>
      </div>
    </div>
  );
}

// ── Quote of the day ──
function QuotePanel() {
  const quote = useRandomQuote('quotes', '');

  if (!quote) return null;

  return (
    <div style={panelStyle}>
      <SectionLabel icon={<PixelStar size={11} color="var(--accent-primary)" />}>from your quotes</SectionLabel>
      <blockquote style={{
        borderLeft: '2px solid var(--accent-secondary)',
        padding: '8px 16px',
        margin: 0,
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        lineHeight: 1.7,
      }}>
        {quote}
      </blockquote>
    </div>
  );
}
