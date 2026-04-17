import { describe, it, expect } from 'vitest';
import { getSortLabels, getTypeLabels } from './workspaceFilterConfig';

const t = (key: string) => key;

describe('getSortLabels', () => {
  it('returns all sort option keys', () => {
    const labels = getSortLabels(t);
    expect(labels).toHaveProperty('updated');
    expect(labels).toHaveProperty('created');
    expect(labels).toHaveProperty('title');
  });

  it('uses the translate function for each label', () => {
    const mockT = (key: string) => `translated:${key}`;
    const labels = getSortLabels(mockT);
    expect(labels.updated).toBe('translated:lastUpdated');
    expect(labels.created).toBe('translated:dateCreated');
    expect(labels.title).toBe('translated:titleAZ');
  });
});

describe('getTypeLabels', () => {
  it('returns all content type filter keys', () => {
    const labels = getTypeLabels(t);
    expect(labels).toHaveProperty('all');
    expect(labels).toHaveProperty('course');
    expect(labels).toHaveProperty('content');
    expect(labels).toHaveProperty('quiz');
    expect(labels).toHaveProperty('collection');
  });

  it('uses the translate function for each label', () => {
    const mockT = (key: string) => `translated:${key}`;
    const labels = getTypeLabels(mockT);
    expect(labels.all).toBe('translated:allTypes');
    expect(labels.course).toBe('translated:course');
    expect(labels.content).toBe('translated:content.label');
    expect(labels.quiz).toBe('translated:quiz');
    expect(labels.collection).toBe('translated:collection.label');
  });

  it('returns an object with exactly 5 keys', () => {
    const labels = getTypeLabels(t);
    expect(Object.keys(labels)).toHaveLength(5);
  });
});
