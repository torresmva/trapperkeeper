import { Router } from 'express';
import https from 'https';
import http from 'http';
import net from 'net';
import fs from 'fs/promises';
import { config } from '../config';

const router = Router();

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BOT_UA = 'TrapperKeeper:wire:v1.0 (personal dashboard)';

// Simple fetch helper for server-side proxying (avoids CORS)
function fetchJSON(url: string, timeout = 8000, headers?: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.get(url, {
      timeout,
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'application/json',
        ...headers,
      },
    }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJSON(res.headers.location, timeout, headers).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid JSON (status ${res.statusCode}): ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function fetchText(url: string, timeout = 8000, headers?: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      timeout,
      headers: { 'User-Agent': BROWSER_UA, ...headers },
    }, (res) => {
      // Follow redirects (carry auth headers forward)
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchText(res.headers.location, timeout, headers).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode === 401) {
        reject(new Error('Authentication required (401) — check username/password'));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Parse RSS/Atom XML into simple items (no dependency needed)
function parseRSSItems(xml: string, limit = 10, sourceName?: string): { title: string; link: string; source: string }[] {
  const items: { title: string; link: string; source: string }[] = [];

  // Get feed title
  const feedTitleMatch = xml.match(/<channel>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>|<channel>[\s\S]*?<title>(.*?)<\/title>/);
  const feedTitle = sourceName || feedTitleMatch?.[1] || feedTitleMatch?.[2] || '';

  // Match <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
    const link = block.match(/<link>(.*?)<\/link>/);
    if (title && link) {
      items.push({
        title: (title[1] || title[2] || '').trim(),
        link: link[1].trim(),
        source: feedTitle,
      });
    }
  }

  // Also try Atom format (<entry> blocks)
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    while ((match = entryRegex.exec(xml)) !== null && items.length < limit) {
      const block = match[1];
      const title = block.match(/<title.*?>(.*?)<\/title>/);
      const link = block.match(/<link.*?href="(.*?)"/);
      if (title && link) {
        items.push({
          title: title[1].trim(),
          link: link[1].trim(),
          source: feedTitle,
        });
      }
    }
  }

  return items;
}

// ── Simple in-memory cache to avoid hammering APIs ──
const cache: Record<string, { data: any; expires: number }> = {};

function getCached(key: string): any | null {
  const entry = cache[key];
  if (entry && Date.now() < entry.expires) return entry.data;
  return null;
}

function setCache(key: string, data: any, ttlMs: number) {
  cache[key] = { data, expires: Date.now() + ttlMs };
}

// ── Weather (Open-Meteo — free, no API key) ──
router.get('/weather', async (_req, res) => {
  try {
    const lat = _req.query.lat || '40.7128';
    const lon = _req.query.lon || '-74.0060';
    const cacheKey = `weather-${lat}-${lon}`;

    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const [data, geo] = await Promise.all([
      fetchJSON(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3`
      ),
      fetchJSON(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        5000
      ).catch(() => null),
    ]);

    const city = geo?.city || geo?.locality || '';
    const state = geo?.principalSubdivision || '';

    const result = { ...data, city, state };
    setCache(cacheKey, result, 15 * 60 * 1000); // 15 min
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: 'Weather fetch failed', message: err.message });
  }
});

// ── News headlines (HN + AP + Reddit) ──
router.get('/news', async (_req, res) => {
  try {
    const cached = getCached('news');
    if (cached) return res.json(cached);

    const results: { title: string; link: string; source: string; points?: number; comments?: number }[] = [];

    // Hacker News top stories
    try {
      const ids: number[] = await fetchJSON('https://hacker-news.firebaseio.com/v0/topstories.json');
      const top = ids.slice(0, 10);
      const stories = await Promise.all(
        top.map((id: number) => fetchJSON(`https://hacker-news.firebaseio.com/v0/item/${id}.json`))
      );
      for (const s of stories) {
        if (s && s.title) {
          results.push({
            title: s.title,
            link: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
            source: 'HN',
            points: s.score,
            comments: s.descendants || 0,
          });
        }
      }
    } catch {}

    // AP News RSS
    try {
      const apXml = await fetchText('https://feedx.net/rss/ap.xml');
      const apItems = parseRSSItems(apXml, 8, 'AP');
      for (const item of apItems) {
        results.push(item);
      }
    } catch {}

    // Reddit /r/networking — must use browser-like UA+Accept; bot UAs and json Accept both get 403'd
    try {
      const redditData = await fetchJSON('https://www.reddit.com/r/networking/hot.json?limit=15&raw_json=1', 8000, {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      });
      if (redditData?.data?.children) {
        for (const child of redditData.data.children) {
          const post = child.data;
          if (post && post.title && !post.stickied) {
            results.push({
              title: post.title,
              link: `https://reddit.com${post.permalink}`,
              source: 'r/networking',
              points: post.score,
              comments: post.num_comments || 0,
            });
          }
        }
      }
    } catch {}

    const response = { items: results };
    setCache('news', response, 10 * 60 * 1000); // 10 min
    res.json(response);
  } catch (err: any) {
    res.status(502).json({ error: 'News fetch failed', message: err.message });
  }
});

// ── Markets snapshot ──
// Yahoo Finance requires a crumb+cookie pair. We fetch that first, then use it.
let yahooCrumb: { crumb: string; cookie: string; expires: number } | null = null;

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string }> {
  if (yahooCrumb && Date.now() < yahooCrumb.expires) {
    return yahooCrumb;
  }

  return new Promise((resolve, reject) => {
    // Step 1: Hit Yahoo to get a session cookie
    const req = https.get('https://fc.yahoo.com', {
      headers: { 'User-Agent': BROWSER_UA },
      timeout: 8000,
    }, (res) => {
      // We expect a 404 but we get cookies from it
      let cookies = '';
      const setCookies = res.headers['set-cookie'];
      if (setCookies) {
        cookies = setCookies.map(c => c.split(';')[0]).join('; ');
      }
      res.resume(); // drain

      res.on('end', () => {
        // Step 2: Use that cookie to get a crumb
        const crumbReq = https.get('https://query2.finance.yahoo.com/v1/test/getcrumb', {
          headers: {
            'User-Agent': BROWSER_UA,
            'Cookie': cookies,
          },
          timeout: 8000,
        }, (crumbRes) => {
          let crumbData = '';
          crumbRes.on('data', (chunk: string) => (crumbData += chunk));
          crumbRes.on('end', () => {
            if (crumbData && crumbRes.statusCode === 200) {
              yahooCrumb = { crumb: crumbData.trim(), cookie: cookies, expires: Date.now() + 3600000 };
              resolve(yahooCrumb);
            } else {
              reject(new Error(`Crumb fetch failed: ${crumbRes.statusCode}`));
            }
          });
        });
        crumbReq.on('error', reject);
      });
    });
    req.on('error', reject);
  });
}

router.get('/markets', async (_req, res) => {
  try {
    const cached = getCached('markets');
    if (cached) return res.json(cached);

    const symbols = ['^GSPC', '^IXIC', '^DJI', 'CL=F', 'GC=F', 'BTC-USD'];
    const nameMap: Record<string, string> = {
      '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ', '^DJI': 'DOW',
      'CL=F': 'Oil (WTI)', 'GC=F': 'Gold', 'BTC-USD': 'Bitcoin',
    };

    let markets: any[] = [];

    // Strategy 1: Yahoo Finance with crumb auth
    try {
      const { crumb, cookie } = await getYahooCrumb();
      const symbolStr = symbols.map(s => encodeURIComponent(s)).join(',');
      const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbolStr}&crumb=${encodeURIComponent(crumb)}`;
      const data = await fetchJSON(url, 8000, { 'Cookie': cookie });

      if (data?.quoteResponse?.result) {
        for (const q of data.quoteResponse.result) {
          markets.push({
            symbol: q.symbol,
            name: nameMap[q.symbol] || q.shortName || q.symbol,
            price: q.regularMarketPrice,
            change: Math.round((q.regularMarketChange || 0) * 100) / 100,
            changePct: Math.round((q.regularMarketChangePercent || 0) * 100) / 100,
          });
        }
      }
    } catch (e: any) {
      console.log('Yahoo crumb strategy failed:', e.message);
    }

    // Strategy 2: Yahoo v8 spark (no auth, sometimes works)
    if (markets.length === 0) {
      try {
        const symbolStr = symbols.map(s => encodeURIComponent(s)).join(',');
        const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbolStr}&range=1d&interval=15m`;
        const data = await fetchJSON(url);

        if (data?.spark?.result) {
          for (const item of data.spark.result) {
            const sym = item.symbol;
            const meta = item.response?.[0]?.meta;
            if (meta) {
              const price = meta.regularMarketPrice;
              const prevClose = meta.previousClose || meta.chartPreviousClose;
              const change = prevClose ? price - prevClose : 0;
              const changePct = prevClose ? ((change / prevClose) * 100) : 0;
              markets.push({
                symbol: sym,
                name: nameMap[sym] || sym,
                price,
                change: Math.round(change * 100) / 100,
                changePct: Math.round(changePct * 100) / 100,
              });
            }
          }
        }
      } catch (e: any) {
        console.log('Yahoo spark strategy failed:', e.message);
      }
    }

    // Strategy 3: Google Finance scrape as last resort for major indices
    if (markets.length === 0) {
      try {
        // Use CoinGecko for BTC at minimum (always works, no auth)
        const btc = await fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
        if (btc?.bitcoin) {
          markets.push({
            symbol: 'BTC-USD',
            name: 'Bitcoin',
            price: Math.round(btc.bitcoin.usd),
            change: 0,
            changePct: Math.round((btc.bitcoin.usd_24h_change || 0) * 100) / 100,
          });
        }
      } catch {}
    }

    const response = { markets };
    if (markets.length > 0) {
      setCache('markets', response, 5 * 60 * 1000); // 5 min
    }
    res.json(response);
  } catch (err: any) {
    res.status(502).json({ error: 'Markets fetch failed', message: err.message });
  }
});

// ── System status — ping configured services ──

interface ServiceConfig {
  id: string;
  name: string;
  host: string;
  port?: number;
  type: 'http' | 'https' | 'tcp';
  path?: string;
}

async function loadServices(): Promise<ServiceConfig[]> {
  try {
    const raw = await fs.readFile(config.wireServicesFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // Default: just TK itself
    const defaults: ServiceConfig[] = [
      { id: 'tk', name: 'trapperkeeper', host: 'localhost', port: config.port, type: 'http', path: '/api/auth/check' },
    ];
    await fs.writeFile(config.wireServicesFile, JSON.stringify(defaults, null, 2));
    return defaults;
  }
}

function pingHTTP(svc: ServiceConfig): Promise<{ up: boolean; latency: number; status?: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const proto = svc.type === 'https' ? https : http;
    const port = svc.port || (svc.type === 'https' ? 443 : 80);
    const url = `${svc.type}://${svc.host}:${port}${svc.path || '/'}`;

    const req = proto.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'TrapperKeeper-Wire/1.0' },
      rejectUnauthorized: false, // allow self-signed certs
    } as any, (res) => {
      res.resume();
      const latency = Date.now() - start;
      resolve({ up: true, latency, status: res.statusCode });
    });

    req.on('error', () => resolve({ up: false, latency: Date.now() - start }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ up: false, latency: Date.now() - start });
    });
  });
}

function pingTCP(svc: ServiceConfig): Promise<{ up: boolean; latency: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(svc.port || 80, svc.host, () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ up: true, latency });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ up: false, latency: Date.now() - start });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ up: false, latency: Date.now() - start });
    });
  });
}

router.get('/status', async (_req, res) => {
  try {
    const services = await loadServices();
    const results = await Promise.all(
      services.map(async (svc) => {
        const result = svc.type === 'tcp'
          ? await pingTCP(svc)
          : await pingHTTP(svc);
        return {
          id: svc.id,
          name: svc.name,
          host: svc.host,
          port: svc.port,
          type: svc.type,
          ...result,
        };
      })
    );
    res.json({ services: results });
  } catch (err: any) {
    res.status(500).json({ error: 'Status check failed', message: err.message });
  }
});

// CRUD for services
router.get('/services', async (_req, res) => {
  const services = await loadServices();
  res.json(services);
});

router.post('/services', async (req, res) => {
  try {
    const services = await loadServices();
    const { name, host, port, type, path } = req.body;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const svc: ServiceConfig = { id, name, host, port, type: type || 'http', path };
    services.push(svc);
    await fs.writeFile(config.wireServicesFile, JSON.stringify(services, null, 2));
    res.json(svc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    let services = await loadServices();
    services = services.filter(s => s.id !== req.params.id);
    await fs.writeFile(config.wireServicesFile, JSON.stringify(services, null, 2));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Calendar feed — Apple iCal / any .ics URL ──

interface WireConfig {
  calendarUrl?: string;
  calendarUser?: string;
  calendarPass?: string;
}

async function loadWireConfig(): Promise<WireConfig> {
  try {
    const raw = await fs.readFile(config.wireConfigFile, 'utf-8');
    return JSON.parse(raw);
  } catch {
    const defaults: WireConfig = {};
    await fs.writeFile(config.wireConfigFile, JSON.stringify(defaults, null, 2));
    return defaults;
  }
}

// Parse .ics into events
function parseICS(ics: string, targetDate: Date): {
  summary: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}[] {
  const events: any[] = [];
  const targetStr = formatDateYMD(targetDate); // YYYYMMDD

  // Extract VEVENT blocks
  const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;
  while ((match = eventRegex.exec(ics)) !== null) {
    const block = match[1];

    const summary = extractICSField(block, 'SUMMARY') || 'untitled';
    const location = extractICSField(block, 'LOCATION');
    const dtstart = extractICSField(block, 'DTSTART');
    const dtend = extractICSField(block, 'DTEND');
    const rrule = extractICSField(block, 'RRULE');

    if (!dtstart) continue;

    const isAllDay = dtstart.length === 8; // YYYYMMDD vs YYYYMMDDTHHMMSS
    const startDate = parseICSDate(dtstart);
    const endDate = dtend ? parseICSDate(dtend) : startDate;

    if (!startDate) continue;

    // Check if event falls on target date
    const startStr = formatDateYMD(startDate);
    const endStr = formatDateYMD(endDate || startDate);

    let isOnDate = false;

    // Direct match
    if (startStr === targetStr || (startStr <= targetStr && endStr >= targetStr)) {
      isOnDate = true;
    }

    // Simple recurring event support (DAILY, WEEKLY, MONTHLY, YEARLY)
    if (!isOnDate && rrule) {
      isOnDate = checkRecurrence(rrule, startDate, targetDate);
    }

    if (isOnDate) {
      events.push({
        summary,
        location: location || undefined,
        startTime: isAllDay ? 'all day' : formatTime(startDate),
        endTime: isAllDay ? '' : (endDate ? formatTime(endDate) : ''),
        allDay: isAllDay,
        _sortKey: isAllDay ? '00:00' : formatTime24(startDate),
      });
    }
  }

  // Sort by time
  events.sort((a, b) => a._sortKey.localeCompare(b._sortKey));
  return events.map(({ _sortKey, ...rest }) => rest);
}

function extractICSField(block: string, field: string): string | null {
  // Handle fields with params like DTSTART;TZID=America/New_York:20260314T090000
  const regex = new RegExp(`^${field}[;:]([^\\r\\n]+)`, 'm');
  const match = block.match(regex);
  if (!match) return null;
  let val = match[1];
  // Strip params before the value (after last colon for parameterized fields)
  if (val.includes(':') && !field.includes(':')) {
    val = val.split(':').pop() || val;
  }
  // Handle folded lines (continuation lines start with space/tab)
  return val.replace(/\r?\n[ \t]/g, '').trim();
}

function parseICSDate(dateStr: string): Date | null {
  try {
    // YYYYMMDD
    if (dateStr.length === 8) {
      return new Date(+dateStr.slice(0, 4), +dateStr.slice(4, 6) - 1, +dateStr.slice(6, 8));
    }
    // YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
    const y = +dateStr.slice(0, 4);
    const m = +dateStr.slice(4, 6) - 1;
    const d = +dateStr.slice(6, 8);
    const h = +dateStr.slice(9, 11);
    const min = +dateStr.slice(11, 13);
    const s = +dateStr.slice(13, 15) || 0;

    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(y, m, d, h, min, s));
    }
    return new Date(y, m, d, h, min, s);
  } catch {
    return null;
  }
}

function formatDateYMD(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

function formatTime24(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function checkRecurrence(rrule: string, eventStart: Date, targetDate: Date): boolean {
  if (targetDate < eventStart) return false;

  const freq = rrule.match(/FREQ=(\w+)/)?.[1];
  const untilMatch = rrule.match(/UNTIL=(\d+)/);
  if (untilMatch) {
    const until = parseICSDate(untilMatch[1]);
    if (until && targetDate > until) return false;
  }

  const interval = parseInt(rrule.match(/INTERVAL=(\d+)/)?.[1] || '1');
  const byDay = rrule.match(/BYDAY=([^;]+)/)?.[1];

  switch (freq) {
    case 'DAILY': {
      const diffDays = Math.round((targetDate.getTime() - eventStart.getTime()) / 86400000);
      return diffDays >= 0 && diffDays % interval === 0;
    }
    case 'WEEKLY': {
      if (byDay) {
        const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
        const days = byDay.split(',').map(d => dayMap[d.trim()]).filter(d => d !== undefined);
        return days.includes(targetDate.getDay());
      }
      const diffDays = Math.round((targetDate.getTime() - eventStart.getTime()) / 86400000);
      return diffDays >= 0 && (diffDays % (7 * interval)) === 0;
    }
    case 'MONTHLY': {
      return targetDate.getDate() === eventStart.getDate();
    }
    case 'YEARLY': {
      return targetDate.getMonth() === eventStart.getMonth() &&
             targetDate.getDate() === eventStart.getDate();
    }
    default:
      return false;
  }
}

// CalDAV REPORT request to fetch events for a date range
function fetchCalDAV(calUrl: string, authHeader: string, startDate: Date, endDate: Date): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(calUrl);
    const mod = parsed.protocol === 'https:' ? https : http;

    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const body = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${fmt(startDate)}" end="${fmt(endDate)}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'REPORT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': '1',
        'User-Agent': 'TrapperKeeper/1.0',
        'Content-Length': String(Buffer.byteLength(body)),
      },
    };

    const req = mod.request(options, (res) => {
      if (res.statusCode === 401) {
        res.resume();
        reject(new Error('401'));
        return;
      }
      let data = '';
      res.on('data', (chunk: string) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`CalDAV error ${res.statusCode}`));
          return;
        }
        // Extract all calendar-data CDATA sections which contain ICS blocks
        const icsBlocks: string[] = [];
        const cdataRegex = /\<!\[CDATA\[([\s\S]*?)\]\]>/g;
        let m;
        while ((m = cdataRegex.exec(data)) !== null) {
          if (m[1].includes('BEGIN:VEVENT')) {
            icsBlocks.push(m[1]);
          }
        }
        // Also try without CDATA (some servers inline the data)
        if (icsBlocks.length === 0) {
          const calDataRegex = /calendar-data[^>]*>([\s\S]*?)<\/.*?calendar-data>/g;
          while ((m = calDataRegex.exec(data)) !== null) {
            const content = m[1].replace(/<!\[CDATA\[|\]\]>/g, '');
            if (content.includes('BEGIN:VEVENT')) {
              icsBlocks.push(content);
            }
          }
        }
        // Combine all ICS blocks into one parseable string
        resolve(icsBlocks.join('\n'));
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.setTimeout(15000);
    req.write(body);
    req.end();
  });
}

function isCalDAVUrl(url: string): boolean {
  return url.includes('caldav') || url.includes('CalDAV');
}

router.get('/calendar', async (_req, res) => {
  try {
    const cached = getCached('calendar');
    if (cached) return res.json(cached);

    const cfg = await loadWireConfig();
    if (!cfg.calendarUrl) {
      return res.json({ events: [], tomorrow: [], configured: false });
    }

    // Build auth header if username/password provided (Apple app-specific passwords)
    let authHeader = '';
    if (cfg.calendarUser && cfg.calendarPass) {
      authHeader = 'Basic ' + Buffer.from(`${cfg.calendarUser}:${cfg.calendarPass}`).toString('base64');
    }

    // Normalize URL: webcal:// → https://
    let calUrl = cfg.calendarUrl.replace(/^webcal:\/\//, 'https://');
    if (!calUrl.startsWith('http')) {
      calUrl = 'https://' + calUrl;
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfTomorrow = new Date(startOfToday);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 2);

    let icsText: string;

    if (isCalDAVUrl(calUrl)) {
      // CalDAV protocol — use REPORT method to query events by time range
      if (!authHeader) {
        return res.json({ events: [], tomorrow: [], configured: true, error: 'caldav_needs_auth' });
      }
      try {
        icsText = await fetchCalDAV(calUrl, authHeader, startOfToday, endOfTomorrow);
      } catch (fetchErr: any) {
        if (fetchErr.message?.includes('401')) {
          return res.json({ events: [], tomorrow: [], configured: true, error: 'auth_failed' });
        }
        throw fetchErr;
      }
    } else {
      // Plain ICS URL — simple GET
      const calHeaders: Record<string, string> = {};
      if (authHeader) calHeaders['Authorization'] = authHeader;
      try {
        icsText = await fetchText(calUrl, 15000, calHeaders);
      } catch (fetchErr: any) {
        if (fetchErr.message?.includes('401')) {
          return res.json({ events: [], tomorrow: [], configured: true, error: 'auth_failed' });
        }
        throw fetchErr;
      }

      // Verify we got ICS data (not HTML error page)
      if (!icsText.includes('BEGIN:VCALENDAR') && !icsText.includes('BEGIN:VEVENT')) {
        console.log('Calendar response is not ICS format, first 200 chars:', icsText.slice(0, 200));
        return res.json({ events: [], tomorrow: [], configured: true, error: 'invalid_format' });
      }
    }

    const events = parseICS(icsText, today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowEvents = parseICS(icsText, tomorrow);

    const response = {
      events,
      tomorrow: tomorrowEvents,
      configured: true,
    };

    setCache('calendar', response, 10 * 60 * 1000); // 10 min
    res.json(response);
  } catch (err: any) {
    console.log('Calendar fetch error:', err.message);
    res.json({ events: [], tomorrow: [], configured: true, error: err.message });
  }
});

// Set calendar config (url + optional auth)
router.put('/calendar/config', async (req, res) => {
  try {
    const cfg = await loadWireConfig();
    cfg.calendarUrl = req.body.url || '';
    cfg.calendarUser = req.body.user || '';
    cfg.calendarPass = req.body.pass || '';
    await fs.writeFile(config.wireConfigFile, JSON.stringify(cfg, null, 2));
    delete cache['calendar'];
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/calendar/config', async (_req, res) => {
  const cfg = await loadWireConfig();
  res.json({
    url: cfg.calendarUrl || '',
    user: cfg.calendarUser || '',
    hasPass: !!cfg.calendarPass,
  });
});

export default router;
