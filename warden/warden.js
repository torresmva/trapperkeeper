#!/usr/bin/env node
// trapperkeeper-warden
// lightweight companion that manages TK lifecycle from the outside:
//   - health monitoring with auto-restart
//   - update endpoint: pull image + recreate container
//   - no compose dependency, pure docker CLI

const http = require('http');
const { execSync, exec } = require('child_process');

const PORT = parseInt(process.env.WARDEN_PORT || '3002');
const TK = process.env.TK_CONTAINER || 'trapperkeeper';
const TK_HEALTH = process.env.TK_HEALTH_URL || `http://${TK}:3001/api/update/health`;
const HEALTH_INTERVAL = parseInt(process.env.HEALTH_INTERVAL || '30') * 1000;
const MAX_FAILURES = parseInt(process.env.MAX_FAILURES || '3');

let healthFailures = 0;
let updating = false;

function log(msg) { console.log(`[warden] ${new Date().toISOString().slice(11, 19)} ${msg}`); }

function run(cmd, timeout = 30000) {
  return execSync(cmd, { encoding: 'utf-8', timeout, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function runAsync(cmd, timeout = 120000) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout.trim());
    });
  });
}

// ── Health monitor ──────────────────────────────────────────────

function checkHealth() {
  const req = http.get(TK_HEALTH, { timeout: 5000 }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      if (res.statusCode === 200) {
        if (healthFailures > 0) log('health restored');
        healthFailures = 0;
      } else {
        onHealthFail(`HTTP ${res.statusCode}`);
      }
    });
  });
  req.on('error', (e) => onHealthFail(e.message));
  req.on('timeout', () => { req.destroy(); onHealthFail('timeout'); });
}

function onHealthFail(reason) {
  healthFailures++;
  log(`health check failed: ${reason} (${healthFailures}/${MAX_FAILURES})`);
  if (healthFailures >= MAX_FAILURES && !updating) {
    log(`restarting ${TK}...`);
    try { run(`docker restart ${TK}`, 60000); } catch {}
    healthFailures = 0;
  }
}

// ── Update: pull + recreate ─────────────────────────────────────

async function doUpdate(image) {
  if (updating) return { ok: false, error: 'update already in progress' };
  updating = true;
  log(`update started: ${image}`);

  try {
    // Pull
    log('pulling image...');
    await runAsync(`docker pull ${image}`);

    // Read current container config via docker inspect go templates
    let portFlags = '';
    try {
      const ports = run(`docker inspect ${TK} --format='{{range $p, $conf := .HostConfig.PortBindings}}{{range $conf}}-p {{.HostPort}}:{{end}}{{$p}} {{end}}'`);
      // Format comes out as: -p 3001:3001/tcp -p 3443:3443/tcp
      portFlags = ports.replace(/\/tcp/g, '').replace(/\/udp/g, '').replace(/'/g, '');
    } catch {
      portFlags = '-p 3001:3001 -p 3443:3443';
    }

    // Volumes
    let volFlags = '';
    try {
      const vols = run(`docker inspect ${TK} --format='{{range .Mounts}}{{if eq .Type "volume"}}-v {{.Name}}:{{.Destination}} {{end}}{{if eq .Type "bind"}}-v {{.Source}}:{{.Destination}}{{if not .RW}}:ro{{end}} {{end}}{{end}}'`);
      volFlags = vols.replace(/'/g, '');
    } catch {}

    // Env vars → temp file
    let envFile = '';
    try {
      const envs = run(`docker inspect ${TK} --format='{{range .Config.Env}}{{println .}}{{end}}'`);
      const envPath = `/tmp/tk-env-${Date.now()}`;
      require('fs').writeFileSync(envPath, envs.replace(/'/g, ''));
      envFile = `--env-file ${envPath}`;
    } catch {}

    // Restart policy
    let restart = 'unless-stopped';
    try { restart = run(`docker inspect ${TK} --format='{{.HostConfig.RestartPolicy.Name}}'`).replace(/'/g, '') || restart; } catch {}

    // Networks — capture which networks the container is on (excluding bridge)
    let networks = [];
    try {
      const nets = run(`docker inspect ${TK} --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'`).replace(/'/g, '');
      networks = nets.split(/\s+/).filter(n => n && n !== 'bridge');
    } catch {}

    // Stop + remove
    log('stopping container...');
    try { run(`docker stop ${TK}`, 30000); } catch {}
    try { run(`docker rm ${TK}`, 10000); } catch {}

    // Clean up mangled containers from old failed attempts
    try {
      const stale = run(`docker ps -a --format '{{.Names}}' | grep '_${TK}' || true`);
      if (stale) {
        for (const name of stale.split('\n').filter(Boolean)) {
          try { run(`docker rm -f ${name}`); } catch {}
        }
      }
    } catch {}

    // Start new — use --network to join the right network from the start
    log('starting new container...');
    const networkFlag = networks.length > 0 ? `--network ${networks[0]}` : '';
    const cmd = `docker run -d --name ${TK} --restart ${restart} ${networkFlag} ${envFile} ${portFlags} ${volFlags} ${image}`;
    log(`> ${cmd}`);
    run(cmd, 30000);

    // Connect to any additional networks
    for (let i = 1; i < networks.length; i++) {
      try { run(`docker network connect ${networks[i]} ${TK}`); } catch {}
    }

    // Wait for health
    log('waiting for health...');
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await fetch(TK_HEALTH, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          log('update complete — healthy');
          return { ok: true };
        }
      } catch {}
    }

    log('started but health pending');
    return { ok: true, warning: 'started but health check not passing yet' };

  } catch (err) {
    log(`update failed: ${err.message}`);
    return { ok: false, error: err.message };
  } finally {
    updating = false;
    try { const fs = require('fs'); fs.readdirSync('/tmp').filter(f => f.startsWith('tk-env-')).forEach(f => fs.unlinkSync(`/tmp/${f}`)); } catch {}
  }
}

// ── HTTP server ─────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const json = (data, status = 200) => {
    const body = JSON.stringify(data);
    res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
    res.end(body);
  };

  try {
    if (path === '/health') {
      return json({ ok: true, service: 'warden' });
    }

    if (path === '/status') {
      let status = 'unknown', image = 'unknown', uptime = 0;
      try {
        status = run(`docker inspect ${TK} --format='{{.State.Status}}'`).replace(/'/g, '');
        image = run(`docker inspect ${TK} --format='{{.Config.Image}}'`).replace(/'/g, '');
      } catch {}
      return json({ ok: true, container: status, image, healthFailures, updating });
    }

    if (path === '/update' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const { image } = JSON.parse(body || '{}');
      if (!image) return json({ ok: false, error: 'image field required' }, 400);
      const result = await doUpdate(image);
      return json(result);
    }

    if (path === '/restart' && req.method === 'POST') {
      log('restart requested');
      try { run(`docker restart ${TK}`, 60000); return json({ ok: true }); }
      catch (e) { return json({ ok: false, error: e.message }, 500); }
    }

    json({ ok: false, error: 'not found' }, 404);
  } catch (e) {
    json({ ok: false, error: e.message }, 500);
  }
});

// ── Start ───────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
  log(`listening on :${PORT}`);
  log(`monitoring ${TK} at ${TK_HEALTH}`);
});

setInterval(checkHealth, HEALTH_INTERVAL);

// Initial health check after 10s
setTimeout(checkHealth, 10000);
