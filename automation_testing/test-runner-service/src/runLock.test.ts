import { describe, it, expect, beforeEach } from 'vitest';
import { startRun, finishRun, isRunInProgress, getRun, listRuns, resetForTests } from './runLock.js';

describe('runLock', () => {
    beforeEach(() => {
        resetForTests();
    });

    it('reports no run in progress initially', () => {
        expect(isRunInProgress()).toBe(false);
        expect(listRuns()).toEqual([]);
    });

    it('starts a run and marks it in progress', () => {
        const run = startRun('https://test.sunbirded.org');

        expect(isRunInProgress()).toBe(true);
        expect(run.status).toBe('running');
        expect(getRun(run.id)).toEqual(run);
    });

    it('rejects starting a second run while one is active', () => {
        startRun('https://test.sunbirded.org');

        expect(() => startRun('https://test.sunbirded.org')).toThrow('A run is already in progress');
    });

    it('allows a new run once the previous one finishes', () => {
        const first = startRun('https://test.sunbirded.org');
        finishRun(first.id, 'passed');

        expect(isRunInProgress()).toBe(false);
        expect(() => startRun('https://test.sunbirded.org')).not.toThrow();
    });

    it('records the finished status and timestamp', () => {
        const run = startRun('https://test.sunbirded.org');
        finishRun(run.id, 'failed');

        const updated = getRun(run.id);
        expect(updated?.status).toBe('failed');
        expect(updated?.finishedAt).toBeDefined();
    });

    it('throws when finishing an unknown run id', () => {
        expect(() => finishRun('does-not-exist', 'passed')).toThrow('Unknown run id');
    });

    it('lists the most recent run first', () => {
        const first = startRun('https://test.sunbirded.org');
        finishRun(first.id, 'passed');
        const second = startRun('https://test.sunbirded.org');

        expect(listRuns()[0]?.id).toBe(second.id);
        expect(listRuns()[1]?.id).toBe(first.id);
    });
});
