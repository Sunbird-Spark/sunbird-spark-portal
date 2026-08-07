import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import path from 'path';

vi.mock('child_process', () => ({
    spawn: vi.fn(),
}));
vi.mock('fs', () => ({
    default: {
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        rmSync: vi.fn(),
    },
}));

import { spawn } from 'child_process';
import fs from 'fs';
import {
    buildDockerArgs,
    buildRebuildArgs,
    rebuildImage,
    reportDirFor,
    runDirFor,
    runE2ESuite,
} from './dockerRunner.js';

/** Lets a pending microtask (e.g. an `await`ed promise settled inside an event
 * listener) actually run before the test moves on to the next spawn/emit step. */
const flushMicrotasks = () => new Promise<void>((resolve) => setImmediate(resolve));

/** runE2ESuite spawns docker twice in sequence (rebuild, then run) — give each
 * call its own EventEmitter so emitting on one doesn't fire listeners on the other. */
function mockTwoDockerProcs() {
    const rebuildProc = new EventEmitter();
    const runProc = new EventEmitter();
    (spawn as any).mockReturnValueOnce(rebuildProc).mockReturnValueOnce(runProc);
    return { rebuildProc, runProc };
}

describe('dockerRunner', () => {
    beforeEach(() => {
        // resetAllMocks (not clearAllMocks) — some tests queue two mockReturnValueOnce
        // values but only consume one (e.g. when the rebuild fails before the run step's
        // spawn call happens); clearAllMocks leaves the unconsumed value queued and it
        // leaks into the next test's first spawn() call.
        vi.resetAllMocks();
    });

    describe('buildDockerArgs', () => {
        it('mounts the report dir and passes an env file', () => {
            const args = buildDockerArgs('/runs/abc/playwright-report', '/runs/abc/.env.docker');

            expect(args).toEqual([
                'run',
                '--rm',
                '-v',
                `${path.resolve('/runs/abc/playwright-report')}:/app/playwright-report`,
                '--env-file',
                '/runs/abc/.env.docker',
                'e2e-runner',
            ]);
        });
    });

    describe('buildRebuildArgs', () => {
        it('builds from web-portal/Dockerfile.e2e and tags it as the configured image', () => {
            const args = buildRebuildArgs();

            expect(args).toEqual([
                'build',
                '-f',
                expect.stringContaining('Dockerfile.e2e'),
                '-t',
                'e2e-runner',
                expect.stringContaining('web-portal'),
            ]);
        });
    });

    describe('runDirFor / reportDirFor', () => {
        it('nests the report dir under the run dir', () => {
            expect(reportDirFor('run-1')).toBe(`${runDirFor('run-1')}/playwright-report`);
        });
    });

    describe('rebuildImage', () => {
        it('resolves ok:true on a clean build', async () => {
            const proc = new EventEmitter();
            (spawn as any).mockReturnValue(proc);

            const resultPromise = rebuildImage();
            proc.emit('close', 0);

            await expect(resultPromise).resolves.toEqual({ ok: true, log: '' });
        });

        it('resolves ok:false (does not throw) on a failed build', async () => {
            const proc = new EventEmitter();
            (spawn as any).mockReturnValue(proc);

            const resultPromise = rebuildImage();
            proc.emit('close', 1);

            await expect(resultPromise).resolves.toEqual({ ok: false, log: '' });
        });

        it('resolves ok:false (does not throw) when spawn itself errors', async () => {
            const proc = new EventEmitter();
            (spawn as any).mockReturnValue(proc);

            const resultPromise = rebuildImage();
            proc.emit('error', new Error('docker not found'));

            const result = await resultPromise;
            expect(result.ok).toBe(false);
            expect(result.log).toContain('docker not found');
        });
    });

    describe('runE2ESuite', () => {
        it('rebuilds the image, then resolves with the container exit code and cleans up the env file', async () => {
            const { rebuildProc, runProc } = mockTwoDockerProcs();

            const resultPromise = runE2ESuite('run-2', 'https://sandbox.sunbirded.org');
            rebuildProc.emit('close', 0);
            await flushMicrotasks();
            runProc.emit('close', 0);
            const exitCode = await resultPromise;

            expect(exitCode).toBe(0);
            expect(fs.mkdirSync).toHaveBeenCalledWith(reportDirFor('run-2'), { recursive: true });
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('.env.docker'),
                expect.stringContaining('BASE_URL=https://sandbox.sunbirded.org'),
                { mode: 0o600 }
            );
            expect(fs.rmSync).toHaveBeenCalledWith(`${runDirFor('run-2')}/.env.docker`, { force: true });
        });

        it('throws when the rebuild fails, without ever running the container', async () => {
            const { rebuildProc } = mockTwoDockerProcs();

            const resultPromise = runE2ESuite('run-x', 'https://test.sunbirded.org');
            rebuildProc.emit('close', 1);

            await expect(resultPromise).rejects.toThrow('Docker image rebuild failed');
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('rejects when the docker run process errors after a successful rebuild', async () => {
            const { rebuildProc, runProc } = mockTwoDockerProcs();

            const resultPromise = runE2ESuite('run-3', 'https://test.sunbirded.org');
            rebuildProc.emit('close', 0);
            await flushMicrotasks();
            runProc.emit('error', new Error('docker not found'));

            await expect(resultPromise).rejects.toThrow('docker not found');
        });

        it('treats a non-zero exit code as a failed run, not a rejection', async () => {
            const { rebuildProc, runProc } = mockTwoDockerProcs();

            const resultPromise = runE2ESuite('run-4', 'https://test.sunbirded.org');
            rebuildProc.emit('close', 0);
            await flushMicrotasks();
            runProc.emit('close', 1);

            await expect(resultPromise).resolves.toBe(1);
        });
    });
});
