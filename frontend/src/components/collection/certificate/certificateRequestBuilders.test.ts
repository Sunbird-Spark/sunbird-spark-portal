import { describe, it, expect } from 'vitest';
import { buildAddTemplateRequestPayload } from './certificateRequestBuilders';

const baseArgs = {
  courseId: 'course-1',
  batchId: 'batch-1',
  selectedTemplateId: 'template-1',
  selectedTemplate: { name: 'My Certificate' },
  issueTo: 'all',
  rootOrgId: 'org-1',
  enableScoreRule: false,
  scoreRuleValue: '',
  fullSignatoryList: undefined,
  lastBuiltSignatoryList: [],
  fullPreviewUrl: 'https://preview.png',
  fullIssuer: { name: 'Org Name', url: 'https://org.example.com' },
};

describe('buildAddTemplateRequestPayload', () => {
  it('builds basic payload with enrollment status 2', () => {
    const result = buildAddTemplateRequestPayload(
      baseArgs.courseId, baseArgs.batchId, baseArgs.selectedTemplateId,
      baseArgs.selectedTemplate, baseArgs.issueTo, baseArgs.rootOrgId,
      baseArgs.enableScoreRule, baseArgs.scoreRuleValue,
      baseArgs.fullSignatoryList, baseArgs.lastBuiltSignatoryList,
      baseArgs.fullPreviewUrl, baseArgs.fullIssuer
    );
    expect(result.batch.courseId).toBe('course-1');
    expect(result.batch.batchId).toBe('batch-1');
    expect(result.batch.template.criteria.enrollment!.status).toBe(2);
  });

  it('adds user criteria when issueTo is "org" (line 21 true branch)', () => {
    const result = buildAddTemplateRequestPayload(
      baseArgs.courseId, baseArgs.batchId, baseArgs.selectedTemplateId,
      baseArgs.selectedTemplate, 'org', baseArgs.rootOrgId,
      baseArgs.enableScoreRule, baseArgs.scoreRuleValue,
      baseArgs.fullSignatoryList, baseArgs.lastBuiltSignatoryList,
      baseArgs.fullPreviewUrl, baseArgs.fullIssuer
    );
    expect(result.batch.template.criteria.user).toEqual({ rootOrgId: 'org-1' });
  });

  it('does not add user criteria when issueTo is not "org"', () => {
    const result = buildAddTemplateRequestPayload(
      baseArgs.courseId, baseArgs.batchId, baseArgs.selectedTemplateId,
      baseArgs.selectedTemplate, 'all', baseArgs.rootOrgId,
      false, '',
      baseArgs.fullSignatoryList, baseArgs.lastBuiltSignatoryList,
      baseArgs.fullPreviewUrl, baseArgs.fullIssuer
    );
    expect(result.batch.template.criteria.user).toBeUndefined();
  });

  it('adds assessment criteria when enableScoreRule is true (line 23 true branch)', () => {
    const result = buildAddTemplateRequestPayload(
      baseArgs.courseId, baseArgs.batchId, baseArgs.selectedTemplateId,
      baseArgs.selectedTemplate, baseArgs.issueTo, baseArgs.rootOrgId,
      true, '75',
      baseArgs.fullSignatoryList, baseArgs.lastBuiltSignatoryList,
      baseArgs.fullPreviewUrl, baseArgs.fullIssuer
    );
    expect((result.batch.template.criteria as any).assessment).toEqual({ score: { '>=': 75 } });
  });

  it('falls back to 90 when scoreRuleValue is empty (line 34 || 90 branch)', () => {
    const result = buildAddTemplateRequestPayload(
      baseArgs.courseId, baseArgs.batchId, baseArgs.selectedTemplateId,
      baseArgs.selectedTemplate, baseArgs.issueTo, baseArgs.rootOrgId,
      true, '',
      baseArgs.fullSignatoryList, baseArgs.lastBuiltSignatoryList,
      baseArgs.fullPreviewUrl, baseArgs.fullIssuer
    );
    expect((result.batch.template.criteria as any).assessment).toEqual({ score: { '>=': 90 } });
  });

  it('falls back to 90 when scoreRuleValue is not a valid number', () => {
    const result = buildAddTemplateRequestPayload(
      baseArgs.courseId, baseArgs.batchId, baseArgs.selectedTemplateId,
      baseArgs.selectedTemplate, baseArgs.issueTo, baseArgs.rootOrgId,
      true, 'not-a-number',
      baseArgs.fullSignatoryList, baseArgs.lastBuiltSignatoryList,
      baseArgs.fullPreviewUrl, baseArgs.fullIssuer
    );
    expect((result.batch.template.criteria as any).assessment).toEqual({ score: { '>=': 90 } });
  });

  it('uses fullSignatoryList when provided', () => {
    const sig = { name: 'Director', designation: 'Dir', id: 'Dir/Dir', image: '' };
    const result = buildAddTemplateRequestPayload(
      baseArgs.courseId, baseArgs.batchId, baseArgs.selectedTemplateId,
      baseArgs.selectedTemplate, baseArgs.issueTo, baseArgs.rootOrgId,
      false, '',
      [sig], [],
      baseArgs.fullPreviewUrl, baseArgs.fullIssuer
    );
    expect(result.batch.template.signatoryList).toEqual([sig]);
  });
});
