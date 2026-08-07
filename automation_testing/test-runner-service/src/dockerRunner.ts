import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

export function runDirFor(runId: string): string {
    return path.join(config.RUNS_DIR, runId);
}

export function reportDirFor(runId: string): string {
    return path.join(runDirFor(runId), 'playwright-report');
}

function buildEnvFileContents(baseUrl: string): string {
    return [
        `BASE_URL=${baseUrl}`,
        `REGISTERED_USER_EMAIL=${config.REGISTERED_USER_EMAIL}`,
        `REGISTERED_USER_PASSWORD=${config.REGISTERED_USER_PASSWORD}`,
        `USER2_EMAIL=${config.USER2_EMAIL}`,
        `USER2_PASSWORD=${config.USER2_PASSWORD}`,
        'CI=true',
    ].join('\n');
}

export function buildDockerArgs(reportDir: string, envFilePath: string): string[] {
    return [
        'run',
        '--rm',
        '-v',
        `${path.resolve(reportDir)}:/app/playwright-report`,
        '--env-file',
        envFilePath,
        config.DOCKER_IMAGE,
    ];
}

export function buildRebuildArgs(): string[] {
    return [
        'build',
        '-f',
        path.join(config.WEB_PORTAL_DIR, 'Dockerfile.e2e'),
        '-t',
        config.DOCKER_IMAGE,
        config.WEB_PORTAL_DIR,
    ];
}

/** Rebuilds the e2e-runner image from current source before every run, so the
 * container running it can never silently drift from what's actually on disk (this
 * bit us twice: a real code fix produced no observable change because the image was
 * never rebuilt after it). Never throws — resolves ok:false with the captured build
 * output on a non-zero exit or spawn error, so the caller decides how to report it. */
export function rebuildImage(): Promise<{ ok: boolean; log: string }> {
    return new Promise((resolve) => {
        const proc = spawn('docker', buildRebuildArgs());
        let log = '';
        proc.stdout?.on('data', (chunk: Buffer) => { log += chunk.toString(); });
        proc.stderr?.on('data', (chunk: Buffer) => { log += chunk.toString(); });
        proc.on('error', (err) => resolve({ ok: false, log: `${log}${String(err)}` }));
        proc.on('close', (code) => resolve({ ok: code === 0, log }));
    });
}

/** Runs the E2E suite in a container against the given environment, resolving with its
 * exit code (0 = all specs passed). `baseUrl` lets the same runner target any instance
 * (test, sandbox, staging, ...) rather than being fixed to one at deploy time. Rebuilds
 * the image first (see rebuildImage) — throws if that fails, which server.ts's caller
 * already reports as an 'error' run. */
export async function runE2ESuite(runId: string, baseUrl: string): Promise<number> {
    const rebuild = await rebuildImage();
    if (!rebuild.ok) {
        console.error(`Docker image rebuild failed for run ${runId}:\n${rebuild.log.slice(-2000)}`);
        throw new Error(`Docker image rebuild failed:\n${rebuild.log.slice(-2000)}`);
    }

    const runDir = runDirFor(runId);
    const reportDir = reportDirFor(runId);
    fs.mkdirSync(reportDir, { recursive: true });

    const envFilePath = path.join(runDir, '.env.docker');
    fs.writeFileSync(envFilePath, buildEnvFileContents(baseUrl), { mode: 0o600 });

    return new Promise((resolve, reject) => {
        const proc = spawn('docker', buildDockerArgs(reportDir, envFilePath));
        proc.on('error', reject);
        proc.on('close', (code) => {
            fs.rmSync(envFilePath, { force: true });
            resolve(code ?? 1);
        });
    });
}
