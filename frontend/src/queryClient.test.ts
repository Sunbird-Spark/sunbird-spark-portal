import { describe, it, expect } from 'vitest';
import { createQueryClient } from './queryClient';

function makeError(message: string, status?: number): Error & { status?: number } {
  const err = new Error(message) as Error & { status?: number };
  if (status !== undefined) err.status = status;
  return err;
}

function getRetryFn(qc: ReturnType<typeof createQueryClient>) {
  const retryOption = qc.getDefaultOptions().queries?.retry;
  if (typeof retryOption !== 'function') throw new Error('retry is not a function');
  return retryOption;
}

describe('createQueryClient retry policy', () => {
  it('does not retry on 400 Bad Request', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(0, makeError('Bad Request', 400))).toBe(false);
  });

  it('does not retry on 401 Unauthorized', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(0, makeError('Unauthorized', 401))).toBe(false);
  });

  it('does not retry on 403 Forbidden', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(0, makeError('Forbidden', 403))).toBe(false);
  });

  it('does not retry on 404 Not Found', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(0, makeError('Not Found', 404))).toBe(false);
  });

  it('does not retry on 422 Unprocessable Entity', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(0, makeError('Unprocessable Entity', 422))).toBe(false);
  });

  it('retries on 500 Internal Server Error (failureCount 0)', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(0, makeError('Server Error', 500))).toBe(true);
  });

  it('retries on 500 Internal Server Error (failureCount 1)', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(1, makeError('Server Error', 500))).toBe(true);
  });

  it('stops retrying on 500 after 2 attempts (failureCount 2)', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(2, makeError('Server Error', 500))).toBe(false);
  });

  it('retries on network error with no status (failureCount 0)', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(0, makeError('Network Error'))).toBe(true);
  });

  it('retries on network error with no status (failureCount 1)', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(1, makeError('Network Error'))).toBe(true);
  });

  it('stops retrying on network error after 2 attempts (failureCount 2)', () => {
    const retry = getRetryFn(createQueryClient());
    expect(retry(2, makeError('Network Error'))).toBe(false);
  });
});
