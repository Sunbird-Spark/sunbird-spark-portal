import { randomUUID } from 'crypto';

export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'error';

export interface RunRecord {
    id: string;
    status: RunStatus;
    baseUrl: string;
    startedAt: string;
    finishedAt?: string;
}

const runs: RunRecord[] = [];
let activeRunId: string | null = null;

export function isRunInProgress(): boolean {
    return activeRunId !== null;
}

/** Throws if a run is already active — enforces the single-run-at-a-time constraint
 * required because the E2E suite mutates real enrollment/certificate state. */
export function startRun(baseUrl: string): RunRecord {
    if (isRunInProgress()) {
        throw new Error('A run is already in progress');
    }
    const run: RunRecord = {
        id: randomUUID(),
        status: 'running',
        baseUrl,
        startedAt: new Date().toISOString(),
    };
    runs.unshift(run);
    activeRunId = run.id;
    return run;
}

export function finishRun(id: string, status: 'passed' | 'failed' | 'error'): void {
    const run = runs.find((r) => r.id === id);
    if (!run) {
        throw new Error(`Unknown run id: ${id}`);
    }
    run.status = status;
    run.finishedAt = new Date().toISOString();
    if (activeRunId === id) {
        activeRunId = null;
    }
}

export function getRun(id: string): RunRecord | undefined {
    return runs.find((r) => r.id === id);
}

export function listRuns(): RunRecord[] {
    return runs;
}

/** Test-only: clears all in-memory state between test cases. */
export function resetForTests(): void {
    runs.length = 0;
    activeRunId = null;
}
