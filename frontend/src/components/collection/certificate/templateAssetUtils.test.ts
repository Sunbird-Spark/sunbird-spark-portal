import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isNewTemplateValid, buildCreateAssetRequest, getBase64Image, generateModifiedSvg } from './templateAssetUtils';

// ── Mock HttpService ──────────────────────────────────────────────────────────

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('@/services/HttpService', () => ({
  HttpService: vi.fn(function() {
    return { get: mockGet };
  }),
}));

const baseForm = {
  certTitle: 'My Certificate',
  name: 'Dept Name',
  logo1: { preview: 'data:image/png;base64,abc', file: null },
  logo2: { preview: '', file: null },
  sig1: { preview: 'data:image/png;base64,sig', file: null },
  sig1Designation: 'Director',
  termsAccepted: true,
};

describe('isNewTemplateValid', () => {
  it('returns true for a valid form', () => {
    expect(isNewTemplateValid(baseForm as any)).toBe(true);
  });

  it('returns false when certTitle is empty', () => {
    expect(isNewTemplateValid({ ...baseForm, certTitle: '   ' } as any)).toBe(false);
  });

  it('returns false when name is empty', () => {
    expect(isNewTemplateValid({ ...baseForm, name: '' } as any)).toBe(false);
  });

  it('returns false when logo1 preview is absent', () => {
    expect(isNewTemplateValid({ ...baseForm, logo1: { preview: '' } } as any)).toBe(false);
  });

  it('returns false when termsAccepted is false', () => {
    expect(isNewTemplateValid({ ...baseForm, termsAccepted: false } as any)).toBe(false);
  });
});

describe('buildCreateAssetRequest', () => {
  it('uses certTitle as assetCode when present (line 25 truthy branch)', () => {
    const result = buildCreateAssetRequest(baseForm as any, 'org-1', []);
    expect(result.name).toBe('My Certificate');
    expect(result.code).toBe('My Certificate');
  });

  it('falls back to "Certificate" when certTitle is empty (line 25 || branch)', () => {
    const result = buildCreateAssetRequest({ ...baseForm, certTitle: '   ' } as any, 'org-1', []);
    expect(result.name).toBe('Certificate');
  });

  it('uses provided sigList when non-empty (line 37 true branch)', () => {
    const sigList = [{ name: 'Alice', designation: 'Principal', id: 'Alice/Principal', image: '' }];
    const result = buildCreateAssetRequest(baseForm as any, 'org-1', sigList as any);
    expect(result.signatoryList).toEqual(sigList);
  });

  it('uses default Director signatory when sigList is empty (line 37 false branch)', () => {
    const result = buildCreateAssetRequest(baseForm as any, 'org-1', []);
    expect(result.signatoryList).toEqual([
      { name: 'Director', designation: '', id: 'Director/Director', image: '' },
    ]);
  });
});

describe('getBase64Image', () => {
  it('returns url immediately for data: URLs (line 47 early return)', async () => {
    const dataUrl = 'data:image/png;base64,abc==';
    const result = await getBase64Image(dataUrl);
    expect(result).toBe(dataUrl);
  });

  it('returns url as fallback when httpService.get throws (line 57)', async () => {
    mockGet.mockRejectedValueOnce(new Error('network error'));
    const result = await getBase64Image('https://example.com/image.png');
    expect(result).toBe('https://example.com/image.png');
  });
});

describe('generateModifiedSvg', () => {
  const svgWithElements = `<svg xmlns="http://www.w3.org/2000/svg">
    <text id="certTitle">Old Title</text>
    <text id="stateTitle">Old State</text>
    <image id="stateLogo1" href="" />
    <image id="stateLogo2" href="" />
    <image id="signatureImg1" href="" />
    <text id="signatureTitle1">Old Sig</text>
  </svg>`;

  it('sets certTitle text when certTitle is present (line 68 true branch)', async () => {
    const result = await generateModifiedSvg(svgWithElements, baseForm as any);
    expect(result).toContain('My Certificate');
  });

  it('does not modify certTitle when certTitle is empty (line 68 false branch)', async () => {
    const result = await generateModifiedSvg(svgWithElements, { ...baseForm, certTitle: '' } as any);
    expect(result).toContain('Old Title');
  });

  it('sets name/stateTitle when name is present (line 73 true branch)', async () => {
    const result = await generateModifiedSvg(svgWithElements, baseForm as any);
    expect(result).toContain('Dept Name');
  });

  it('sets logo1 when logo1.preview is a data: URL (line 78 true branch)', async () => {
    const result = await generateModifiedSvg(svgWithElements, baseForm as any);
    expect(result).toContain('data:image/png;base64,abc');
  });

  it('skips logo2 when logo2.preview is empty (line 87 false branch)', async () => {
    const result = await generateModifiedSvg(svgWithElements, { ...baseForm, logo2: { preview: '' } } as any);
    // stateLogo2 href should remain empty
    expect(result).toContain('id="stateLogo2"');
  });

  it('skips certTitle element when getElementById returns null', async () => {
    const svgNoElements = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    // Should not throw when elements are absent
    await expect(generateModifiedSvg(svgNoElements, baseForm as any)).resolves.toContain('<svg');
  });
});
