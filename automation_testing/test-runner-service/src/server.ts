import express, { Request, Response, NextFunction } from 'express';
import { config } from './config.js';
import { startRun, finishRun, listRuns, isRunInProgress } from './runLock.js';
import { runE2ESuite, reportDirFor } from './dockerRunner.js';

const UUID_PATTERN = /^[0-9a-f-]{36}$/i;

const app = express();

function requireSharedSecret(req: Request, res: Response, next: NextFunction) {
    if (!config.TRIGGER_SHARED_SECRET) {
        return next();
    }
    const [scheme, encoded] = (req.get('authorization') || '').split(' ');
    if (scheme === 'Basic' && encoded) {
        const password = Buffer.from(encoded, 'base64').toString('utf8').split(':')[1] ?? '';
        if (password === config.TRIGGER_SHARED_SECRET) {
            return next();
        }
    }
    res.set('WWW-Authenticate', 'Basic realm="E2E Test Runner"');
    res.status(401).send('Unauthorized');
}

app.use(express.urlencoded({ extended: false }));
app.use(requireSharedSecret);

const ENVIRONMENT_PRESETS = ['https://test.sunbirded.org', 'https://sandbox.sunbirded.org'];

const SUNBIRD_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 150 1280 430" style="height:2.3rem;width:auto;flex-shrink:0;display:block;">
  <g>
    <path fill="#bd4527" d="M116.83,453.56v-21.39h66.07c4.33,0,8.08-.95,11.24-2.85,3.16-1.89,5.55-4.37,7.18-7.44,1.62-3.07,2.44-6.32,2.44-9.75,0-3.25-.72-6.27-2.17-9.07-1.45-2.8-3.66-5.05-6.63-6.77-2.98-1.71-6.55-2.57-10.7-2.57h-27.89c-8.85,0-16.57-1.49-23.15-4.47-6.59-2.98-11.74-7.35-15.44-13.13-3.7-5.78-5.55-12.82-5.55-21.12,0-7.04,1.71-13.54,5.15-19.5,3.43-5.96,8.21-10.78,14.35-14.49,6.14-3.7,13.18-5.55,21.12-5.55h63.64v21.39h-61.2c-5.6,0-10.02,1.72-13.27,5.14-3.25,3.43-4.87,7.5-4.87,12.19s1.67,8.44,5.01,11.78c3.34,3.34,8.08,5.01,14.22,5.01h26.54c9.93,0,18.28,1.58,25.05,4.74,6.77,3.16,11.91,7.72,15.43,13.67,3.52,5.96,5.28,13.27,5.28,21.93,0,7.41-1.81,14.31-5.42,20.72-3.61,6.41-8.62,11.6-15.03,15.57-6.41,3.97-13.86,5.96-22.34,5.96h-69.05Z"/>
    <path fill="#bd4527" d="M320.74,456.81c-12.46,0-23.61-2.57-33.44-7.72-9.84-5.14-17.51-12.32-23.02-21.53-5.51-9.21-8.26-19.94-8.26-32.22v-79.88h25.18v79.61c0,8.31,1.8,15.48,5.42,21.53,3.61,6.05,8.44,10.7,14.49,13.95,6.05,3.25,12.5,4.87,19.36,4.87s13.58-1.63,19.63-4.87c6.05-3.25,10.92-7.9,14.62-13.95,3.7-6.05,5.55-13.22,5.55-21.53v-79.61h25.18v79.88c0,12.28-2.8,23.02-8.39,32.22-5.6,9.21-13.27,16.39-23.02,21.53-9.75,5.14-20.85,7.72-33.31,7.72Z"/>
    <path fill="#bd4527" d="M419.58,453.56v-79.89c0-12.27,2.75-23.02,8.26-32.22,5.5-9.21,13.13-16.38,22.88-21.53,9.75-5.14,20.85-7.72,33.31-7.72s23.78,2.57,33.44,7.72c9.66,5.14,17.24,12.32,22.75,21.53,5.5,9.21,8.26,19.95,8.26,32.22v79.89h-24.91v-79.62c0-8.3-1.85-15.48-5.55-21.53-3.7-6.05-8.58-10.7-14.62-13.94-6.05-3.25-12.5-4.87-19.36-4.87s-13.32,1.62-19.36,4.87c-6.05,3.25-10.93,7.9-14.62,13.94-3.7,6.05-5.55,13.23-5.55,21.53v79.62h-24.91Z"/>
    <path fill="#bd4527" d="M652.47,456.81c-13.36,0-25.37-2.89-36.02-8.66-10.65-5.78-19.09-14.12-25.32-25.05-6.23-10.92-9.34-24.05-9.34-39.4v-127.81h24.91v84.22h.54c3.07-5.59,7.08-10.47,12.05-14.62,4.96-4.15,10.65-7.4,17.06-9.75,6.41-2.34,13.13-3.52,20.17-3.52,12.82,0,24.28,2.89,34.39,8.66,10.11,5.78,18.1,13.94,23.97,24.51,5.86,10.56,8.8,23.07,8.8,37.51,0,11.37-1.76,21.62-5.28,30.73-3.52,9.12-8.44,16.93-14.76,23.42-6.32,6.5-13.81,11.42-22.48,14.76-8.67,3.34-18.24,5.01-28.7,5.01ZM652.47,435.42c8.48,0,16.2-2.07,23.15-6.23,6.95-4.15,12.5-10.02,16.65-17.6,4.15-7.58,6.23-16.61,6.23-27.08s-2.03-18.95-6.09-26.54c-4.06-7.58-9.53-13.54-16.38-17.87-6.86-4.33-14.62-6.5-23.29-6.5s-16.21,2.08-23.15,6.23c-6.95,4.16-12.46,10.07-16.52,17.74-4.06,7.67-6.09,16.75-6.09,27.22s2.03,19.23,6.09,26.81c4.06,7.58,9.57,13.45,16.52,17.6,6.95,4.16,14.58,6.23,22.88,6.23Z"/>
    <path fill="#bd4527" d="M808.44,453.56v-98.84c0-12.27,3.47-21.89,10.43-28.84,6.95-6.95,16.56-10.43,28.84-10.43h28.43v21.39h-23.83c-5.96,0-10.61,1.72-13.95,5.14-3.34,3.43-5.01,8.22-5.01,14.35v97.22h-24.91Z"/>
    <path fill="#bd4527" d="M957.38,456.81c-10.47,0-20.04-1.67-28.7-5.01-8.67-3.34-16.16-8.26-22.48-14.76-6.32-6.5-11.24-14.31-14.76-23.42-3.52-9.11-5.28-19.36-5.28-30.73,0-14.44,2.93-26.94,8.8-37.51,5.86-10.56,13.9-18.73,24.1-24.51,10.2-5.78,21.62-8.66,34.26-8.66,7.04,0,13.76,1.18,20.17,3.52,6.41,2.35,12.14,5.6,17.2,9.75,5.05,4.16,9.02,9.03,11.91,14.62h.54v-84.22h24.91v127.81c0,15.35-3.11,28.48-9.34,39.4-6.23,10.93-14.62,19.28-25.18,25.05-10.56,5.78-22.61,8.66-36.15,8.66ZM957.38,435.42c8.48,0,16.15-2.07,23.02-6.23,6.86-4.15,12.32-10.02,16.38-17.6,4.06-7.58,6.09-16.52,6.09-26.81s-2.03-19.54-6.09-27.22c-4.06-7.67-9.52-13.58-16.38-17.74-6.86-4.15-14.62-6.23-23.29-6.23s-16.21,2.16-23.15,6.5c-6.95,4.34-12.46,10.29-16.52,17.87-4.06,7.58-6.09,16.43-6.09,26.54s2.07,19.5,6.23,27.08c4.15,7.58,9.7,13.45,16.65,17.6,6.95,4.16,14.67,6.23,23.15,6.23Z"/>
    <circle fill="#dc7727" cx="763.51" cy="255.88" r="29.26"/>
    <circle fill="#dc7727" cx="763.51" cy="505.98" r="29.26"/>
  </g>
</svg>`;

const STATUS_STYLES: Record<string, string> = {
    queued: 'background:hsl(210 20% 92%);color:hsl(210 11% 40%);',
    running: 'background:hsl(45 100% 90%);color:hsl(32 70% 32%);',
    passed: 'background:hsl(140 45% 90%);color:hsl(140 45% 26%);',
    failed: 'background:hsl(0 70% 93%);color:hsl(0 65% 40%);',
    error: 'background:hsl(0 70% 93%);color:hsl(0 65% 40%);',
};

function renderHome(): string {
    const rows = listRuns()
        .map((r) => {
            const badge = `<span style="display:inline-block;padding:0.2rem 0.7rem;border-radius:999px;font-size:0.82rem;font-weight:500;${STATUS_STYLES[r.status] ?? ''}">${r.status}</span>`;
            const report = r.status === 'passed' || r.status === 'failed'
                ? `<a href="/runs/${r.id}/report/" style="color:hsl(12 50% 40%);font-weight:500;">View report →</a>`
                : '<span style="color:hsl(210 11% 65%);">—</span>';
            return `<tr>
        <td style="padding:0.6rem 0.8rem;font-family:monospace;font-size:0.82rem;color:hsl(210 11% 45%);">${r.id.slice(0, 8)}</td>
        <td style="padding:0.6rem 0.8rem;">${badge}</td>
        <td style="padding:0.6rem 0.8rem;color:hsl(210 11% 45%);">${r.baseUrl}</td>
        <td style="padding:0.6rem 0.8rem;color:hsl(210 11% 45%);">${r.startedAt}</td>
        <td style="padding:0.6rem 0.8rem;color:hsl(210 11% 45%);">${r.finishedAt ?? ''}</td>
        <td style="padding:0.6rem 0.8rem;">${report}</td>
      </tr>`;
        })
        .join('');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>E2E Test Runner</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Rubik', sans-serif;
      background: hsl(48 23% 91%);
      color: hsl(0 0% 13%);
      max-width: 1200px;
      margin: 2.5rem auto;
      padding: 0 1.25rem;
    }
    .card {
      background: #fff;
      border-radius: 1rem;
      padding: 1.75rem 2rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.06);
      margin-bottom: 1.5rem;
    }
    header { display: flex; align-items: center; gap: 1.1rem; margin-bottom: 1.75rem; }
    h1 { font-size: 1.2rem; font-weight: 500; color: hsl(210 11% 40%); margin: 0; line-height: 1; }
    .table-scroll { overflow-x: auto; }
    h2 { font-size: 1.05rem; font-weight: 600; margin: 0 0 0.9rem; }
    p.desc { color: hsl(210 11% 40%); margin-top: 0.3rem; }
    code { background: hsl(48 23% 94%); padding: 0.1rem 0.4rem; border-radius: 0.3rem; font-size: 0.9em; }
    button {
      font-family: inherit;
      font-size: 1rem;
      font-weight: 500;
      color: #fff;
      background: hsl(12 50% 45%);
      border: none;
      border-radius: 999px;
      padding: 0.65rem 1.6rem;
      cursor: pointer;
    }
    button:disabled { background: hsl(210 15% 80%); cursor: default; }
    label { display:block; font-size:0.85rem; font-weight:500; color:hsl(210 11% 35%); margin-bottom:0.35rem; }
    select {
      font-family: inherit;
      font-size: 0.95rem;
      padding: 0.55rem 0.8rem;
      border: 1px solid hsl(210 20% 82%);
      border-radius: 0.6rem;
      width: 100%;
      max-width: 340px;
      box-sizing: border-box;
      background: #fff;
      cursor: pointer;
    }
    .field { margin-bottom: 1.1rem; }
    table { width: 100%; border-collapse: collapse; }
    thead th { text-align: left; font-size: 0.8rem; font-weight: 600; color: hsl(210 11% 45%); text-transform: uppercase; letter-spacing: 0.03em; padding: 0 0.8rem 0.6rem; border-bottom: 1px solid hsl(210 20% 88%); }
    tbody tr:not(:last-child) td { border-bottom: 1px solid hsl(210 20% 92%); }
  </style>
</head>
<body>
  <header>
    ${SUNBIRD_LOGO_SVG}
    <h1>E2E Test Runner</h1>
  </header>

  <div class="card">
    <p class="desc" style="margin-top:0;">Rebuilds from current source and runs the Playwright suite from <code>automation_testing/web-portal</code> against whichever environment you pick below.</p>
    <form method="post" action="/run">
      <div class="field">
        <label for="baseUrl">Target environment</label>
        <select id="baseUrl" name="baseUrl">
          ${ENVIRONMENT_PRESETS.map((url) => `<option value="${url}" ${url === config.BASE_URL ? 'selected' : ''}>${url.replace('https://', '')}</option>`).join('')}
        </select>
      </div>
      <button type="submit" ${isRunInProgress() ? 'disabled' : ''}>
        ${isRunInProgress() ? 'Building & running…' : 'Run E2E Tests'}
      </button>
    </form>
  </div>

  <div class="card">
    <h2>Run history</h2>
    <div class="table-scroll">
      <table>
        <thead><tr><th>ID</th><th>Status</th><th>Target</th><th>Started</th><th>Finished</th><th>Report</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="padding:0.8rem;color:hsl(210 11% 55%);">No runs yet</td></tr>'}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

app.get('/', (_req, res) => {
    res.type('html').send(renderHome());
});

app.post('/run', (req, res) => {
    const requestedUrl = (req.body?.baseUrl ?? '').trim() || config.BASE_URL;
    try {
        new URL(requestedUrl);
    } catch {
        res.status(400).send(`Invalid target environment URL: ${requestedUrl}`);
        return;
    }

    let run;
    try {
        run = startRun(requestedUrl);
    } catch {
        res.status(409).send('A run is already in progress');
        return;
    }

    runE2ESuite(run.id, requestedUrl)
        .then((exitCode) => finishRun(run.id, exitCode === 0 ? 'passed' : 'failed'))
        .catch(() => finishRun(run.id, 'error'));

    res.redirect('/');
});

app.use('/runs/:id/report', (req, res, next) => {
    if (!UUID_PATTERN.test(req.params.id)) {
        res.status(404).end();
        return;
    }
    express.static(reportDirFor(req.params.id))(req, res, next);
});

app.listen(config.PORT, () => {
    console.log(`E2E test runner listening on port ${config.PORT}`);
});

export { app };
