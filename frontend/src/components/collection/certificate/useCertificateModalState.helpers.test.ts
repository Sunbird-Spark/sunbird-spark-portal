import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveSignatoryList,
  buildSignatoryListFromForm,
  isNewTemplateValid,
  buildCreateAssetRequest,
  applyOptimisticBatchCertUpdate,
  getBase64Image,
  generateModifiedSvg,
  fetchTemplateDetails,
  buildAddTemplateRequestPayload,
  Signatory
} from './useCertificateModalState.helpers';
import { NewTemplateForm } from './types';
import { certificateService } from '@/services/CertificateService';

vi.mock('@/services/CertificateService', () => ({
  certificateService: {
    readCertTemplate: vi.fn(),
  },
}));

describe('useCertificateModalState.helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveSignatoryList', () => {
    it('returns fullSignatoryList if present', () => {
      const full: Signatory[] = [{ name: 'A', designation: 'D', id: 'A/D', image: 'img' }];
      expect(resolveSignatoryList(full, [])).toEqual(full);
    });

    it('returns lastBuiltSignatoryList if fullSignatoryList is empty', () => {
      const lastBuilt: Signatory[] = [{ name: 'B', designation: 'D', id: 'B/D', image: 'img' }];
      expect(resolveSignatoryList([], lastBuilt)).toEqual(lastBuilt);
      expect(resolveSignatoryList(undefined, lastBuilt)).toEqual(lastBuilt);
    });

    it('returns default director if both are empty', () => {
      expect(resolveSignatoryList([], [])).toEqual([{ name: 'Director', designation: '', id: 'Director/Director', image: '' }]);
    });
  });

  describe('applyOptimisticBatchCertUpdate', () => {
    it('returns undefined if oldBatches is undefined', () => {
      expect(applyOptimisticBatchCertUpdate(undefined, 'b1', 't1', {})).toBeUndefined();
    });

    it('returns unmodified batch if id does not match', () => {
      const oldBatches = [{ id: 'other' }];
      const result = applyOptimisticBatchCertUpdate(oldBatches, 'b1', 't1', {});
      expect(result).toEqual(oldBatches);
    });

    it('updates certTemplates of target batch', () => {
      const oldBatches = [{ id: 'b1', certTemplates: { 'old-t': { identifier: 'old-t', name: 'old' } } }];
      const result = applyOptimisticBatchCertUpdate(oldBatches, 'b1', 't1', { name: 'New Cert' });
      expect(result).toEqual([{
        id: 'b1',
        certTemplates: {
          't1': { identifier: 't1', name: 'New Cert' }
        }
      }]);
    });

    it('handles target batch with no certTemplates', () => {
      const oldBatches = [{ id: 'b1' }];
      const result = applyOptimisticBatchCertUpdate(oldBatches, 'b1', 't1', { name: 'Cert' });
      expect(result![0].certTemplates).toEqual({ 't1': { identifier: 't1', name: 'Cert' } });
    });
  });

  describe('getBase64Image', () => {
    it('returns url if it already starts with data:', async () => {
      const result = await getBase64Image('data:image/png;base64,123');
      expect(result).toBe('data:image/png;base64,123');
    });

    it('returns original url if fetch throws', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      const result = await getBase64Image('https://example.com/img');
      expect(result).toBe('https://example.com/img');
      vi.unstubAllGlobals();
    });

    it('returns original url if fetch is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      const result = await getBase64Image('https://example.com/img');
      expect(result).toBe('https://example.com/img');
      vi.unstubAllGlobals();
    });

    it('converts blob to base64 on success', async () => {
      const mockBlob = new Blob(['123'], { type: 'image/png' });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      }));

      class MockFileReader {
        onloadend: any = null;
        onerror: any = null;
        result = 'data:image/png;base64,converted';
        readAsDataURL() {
          setTimeout(() => { if (this.onloadend) this.onloadend({} as any); }, 0);
        }
      }
      vi.stubGlobal('FileReader', MockFileReader);

      const result = await getBase64Image('https://example.com/img');
      expect(result).toBe('data:image/png;base64,converted');
      vi.unstubAllGlobals();
    });
    
    it('returns url on FileReader error', async () => {
      const mockBlob = new Blob(['123'], { type: 'image/png' });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      }));

      class MockFileReader {
        onloadend: any = null;
        onerror: any = null;
        readAsDataURL() {
          setTimeout(() => { if (this.onerror) this.onerror({} as any); }, 0);
        }
      }
      vi.stubGlobal('FileReader', MockFileReader);

      const result = await getBase64Image('https://example.com/error');
      expect(result).toBe('https://example.com/error');
      vi.unstubAllGlobals();
    });
  });

  describe('generateModifiedSvg', () => {
    it('replaces logo1, logo2, and sig1 if they have previews', async () => {
      // Create a dummy form
      const newTmpl: NewTemplateForm = {
        certTitle: 'Test Certificate Title',
        name: 'John Doe',
        logo1: { preview: 'data:img1', file: null, artifactUrl: null },
        logo2: { preview: 'data:img2', file: null, artifactUrl: null },
        sig1: { preview: 'data:sig1', file: null, artifactUrl: null },
        sig2: { preview: '', file: null, artifactUrl: null },
        sig1Designation: 'Manager',
        sig2Designation: '',
        termsAccepted: true,
      };

      const svgText = `
        <svg>
          <text id="certTitle">Old Title</text>
          <text id="stateTitle">Old Name</text>
          <image id="stateLogo1" xlink:href="old1"/>
          <image id="stateLogo2" xlink:href="old2"/>
          <image id="signatureImg1" xlink:href="oldsig"/>
          <text id="signatureTitle1">Old Sig Name</text>
        </svg>
      `;

      const result = await generateModifiedSvg(svgText, newTmpl);
      
      expect(result).toContain('Test Certificate Title');
      expect(result).toContain('John Doe');
      expect(result).toContain('xlink:href="data:img1"');
      expect(result).toContain('xlink:href="data:img2"');
      expect(result).toContain('xlink:href="data:sig1"');
      expect(result).toContain('John Doe, Manager');
    });

    it('does not replace logos if no preview provided', async () => {
      const newTmpl = {
        certTitle: '',
        name: '',
        logo1: { preview: '', file: null, artifactUrl: null },
        logo2: { preview: '', file: null, artifactUrl: null },
        sig1: { preview: '', file: null, artifactUrl: null },
        sig2: { preview: '', file: null, artifactUrl: null },
        sig1Designation: '',
        sig2Designation: '',
        termsAccepted: true,
      };

      const svgText = `
        <svg>
          <image id="stateLogo1" xlink:href="old1"/>
          <image id="stateLogo2" xlink:href="old2"/>
        </svg>
      `;

      const result = await generateModifiedSvg(svgText, newTmpl);
      expect(result).toContain('old1');
      expect(result).toContain('old2');
    });
  });

  describe('fetchTemplateDetails', () => {
    it('falls back to defaults on error', async () => {
      (certificateService.readCertTemplate as any).mockRejectedValue(new Error('fail'));
      const result = await fetchTemplateDetails('t1', 'default-preview', { name: 'default' });
      expect(result).toEqual({ 
        fullSignatoryList: undefined, 
        fullPreviewUrl: 'default-preview', 
        fullIssuer: { name: 'default' } 
      });
    });

    it('extracts details from readCertTemplate response', async () => {
      (certificateService.readCertTemplate as any).mockResolvedValue({
        data: {
          content: {
            signatoryList: [{ name: 'A', id: 'A/A' }, { designation: 'B' }],
            artifactUrl: 'new-url',
            issuer: { name: 'new-issuer' }
          }
        }
      });
      
      const result = await fetchTemplateDetails('t1', '', {});
      expect(result.fullSignatoryList).toEqual([
        { name: 'A', designation: '', id: 'A/A', image: '' },
        { name: '', designation: 'B', id: 'Unknown/B', image: '' }
      ]);
      expect(result.fullPreviewUrl).toBe('new-url');
      expect(result.fullIssuer).toEqual({ name: 'new-issuer' });
    });
  });

  describe('buildAddTemplateRequestPayload', () => {
    it('builds payload with scoreRule and org issueTo', () => {
      const result = buildAddTemplateRequestPayload(
        'c1', 'b1', 't1', { name: 'CertName' },
        'org', 'my-org', true, '80',
        undefined, [{ name: 'S', designation: 'D', id: 'S/D', image: 'i' }],
        'preview', { name: 'issuer' }
      );

      expect(result.batch.template.criteria).toEqual({
        enrollment: { status: 2 },
        user: { rootOrgId: 'my-org' },
        assessment: { score: { '>=': 80 } },
      });
      expect(result.batch.template.issuer).toEqual({ name: 'issuer' });
    });

    it('builds payload securely without score rule and org criteria if not specified', () => {
      const result = buildAddTemplateRequestPayload(
        'c1', 'b1', 't1', { name: 'CertName' },
        'all', 'my-org', false, '90',
        undefined, [{ name: 'S', designation: 'D', id: 'S/D', image: 'i' }],
        'preview', undefined
      );

      expect(result.batch.template.criteria).toEqual({
        enrollment: { status: 2 },
      });
      expect(result.batch.template.issuer).toEqual({ name: 'my-org', url: window.location.origin });
    });
  });
});
