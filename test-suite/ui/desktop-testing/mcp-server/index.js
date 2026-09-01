#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
const url = require('url');

const PORT = process.env.PORT || 3001;

function collectRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function runPlaywright(spec, opts = {}) {
  return new Promise((resolve) => {
    const args = ['playwright', 'test'];
    if (spec) args.push(spec);
    if (opts.project) { args.push('--project=' + opts.project); }
    if (opts.trace !== false) { args.push('--trace=on'); }
    if (opts.headed) { args.push('--headed'); }

    const child = spawn('npx', args, { shell: false });

    let stdout = '';
    let stderr = '';
    const tracePaths = new Set();

    const traceRegex = /(test-results\/[^\s\\]+\/trace\.zip)/g;

    child.stdout.on('data', (data) => {
      const s = data.toString();
      stdout += s;
      let m;
      while ((m = traceRegex.exec(s)) !== null) {
        tracePaths.add(m[1]);
      }
      process.stdout.write(s);
    });
    child.stderr.on('data', (data) => {
      const s = data.toString();
      stderr += s;
      process.stderr.write(s);
      let m;
      while ((m = traceRegex.exec(s)) !== null) {
        tracePaths.add(m[1]);
      }
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr, trace: Array.from(tracePaths) });
    });

    child.on('error', (err) => {
      resolve({ code: 1, stdout, stderr: err.message, trace: Array.from(tracePaths) });
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (req.method === 'GET' && parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', pid: process.pid }));
    return;
  }

  if (req.method === 'POST' && parsed.pathname === '/run') {
    try {
      const raw = await collectRequestBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const spec = body.spec || 'tests/02_course_consume_and_certificate.spec.ts';
      const project = body.project || 'chromium';
      const headed = !!body.headed;
      const trace = body.trace === undefined ? true : !!body.trace;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      // Run the playwright job
      const result = await runPlaywright(spec, { project, headed, trace });
      res.end(JSON.stringify({ success: result.code === 0, exitCode: result.code, trace: result.trace, stdout: result.stdout.slice(-10000), stderr: result.stderr.slice(-10000) }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`MCP-style Playwright server listening on http://localhost:${PORT}`);
});
