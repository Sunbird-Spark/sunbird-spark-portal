import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelemetryService } from './TelemetryService';
import { $t } from '@project-sunbird/telemetry-sdk';

vi.mock('@project-sunbird/telemetry-sdk', () => ({
  $t: {
    initialize: vi.fn(),
    interact: vi.fn(),
    impression: vi.fn(),
    start: vi.fn(),
    end: vi.fn(),
    error: vi.fn(),
    audit: vi.fn(),
    share: vi.fn(),
    log: vi.fn(),
    exdata: vi.fn(),
    feedback: vi.fn(),
  },
}));

describe('TelemetryService', () => {
  let telemetryService: TelemetryService;
  const mockConfig = { pdata: { id: 'test', ver: '1.0.0', pid: 'test-pid' }, env: 'test', channel: 'test', did: 'test', authtoken: '', uid: 'test', sid: 'test', batchsize: 1, host: 'test', endpoint: 'test', tags: [], cdata: [] };
  const mockEventInput = { edata: { type: 'CLICK', id: 'test-id' }, options: { context: { cdata: [] } } };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    telemetryService = new TelemetryService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes correctly', () => {
    expect(telemetryService.isInitialized).toBe(false);
    telemetryService.initialize(mockConfig);
    expect($t.initialize).toHaveBeenCalledWith(mockConfig);
    expect(telemetryService.isInitialized).toBe(true);
  });

  describe('When not initialized', () => {
    it('does not call interact', () => {
      telemetryService.interact(mockEventInput);
      expect($t.interact).not.toHaveBeenCalled();
    });

    it('does not call impression', () => {
      telemetryService.impression(mockEventInput);
      expect($t.impression).not.toHaveBeenCalled();
    });
    
    it('does not call start', () => {
      telemetryService.start(mockConfig, 'app', '1.0', { type: 'app', mode: 'play' });
      expect($t.start).not.toHaveBeenCalled();
    });

    it('does not call end', () => {
      telemetryService.end(mockEventInput);
      expect($t.end).not.toHaveBeenCalled();
    });

    it('does not call error', () => {
      telemetryService.error(mockEventInput);
      expect($t.error).not.toHaveBeenCalled();
    });

    it('does not call audit', () => {
      telemetryService.audit(mockEventInput);
      expect($t.audit).not.toHaveBeenCalled();
    });

    it('does not call share', () => {
      telemetryService.share(mockEventInput);
      expect($t.share).not.toHaveBeenCalled();
    });

    it('does not call log', () => {
      telemetryService.log(mockEventInput);
      expect($t.log).not.toHaveBeenCalled();
    });

    it('does not call exData', () => {
      telemetryService.exData(mockEventInput);
      expect($t.exdata).not.toHaveBeenCalled();
    });

    it('does not call feedback', () => {
      telemetryService.feedback(mockEventInput);
      expect($t.feedback).not.toHaveBeenCalled();
    });
  });

  describe('When initialized', () => {
    beforeEach(() => {
      telemetryService.initialize(mockConfig);
    });

    it('calls interact with correct arguments', () => {
      telemetryService.interact(mockEventInput);
      expect($t.interact).toHaveBeenCalledWith(mockEventInput.edata, mockEventInput.options);
    });

    it('calls start with correct arguments', () => {
      telemetryService.start(mockConfig, 'app', '1.0', { type: 'app', mode: 'play' }, mockEventInput.options);
      expect($t.start).toHaveBeenCalledWith(mockConfig, 'app', '1.0', { type: 'app', mode: 'play' }, mockEventInput.options);
    });

    it('calls end with correct arguments', () => {
      telemetryService.end(mockEventInput);
      expect($t.end).toHaveBeenCalledWith(mockEventInput.edata, mockEventInput.options);
    });

    it('calls error with correct arguments', () => {
      telemetryService.error(mockEventInput);
      expect($t.error).toHaveBeenCalledWith(mockEventInput.edata, mockEventInput.options);
    });

    it('calls audit with correct arguments', () => {
      telemetryService.audit(mockEventInput);
      expect($t.audit).toHaveBeenCalledWith(mockEventInput.edata, mockEventInput.options);
    });

    it('calls share with correct arguments', () => {
      telemetryService.share(mockEventInput);
      expect($t.share).toHaveBeenCalledWith(mockEventInput.edata, mockEventInput.options);
    });

    it('calls log with correct arguments', () => {
      telemetryService.log(mockEventInput);
      expect($t.log).toHaveBeenCalledWith(mockEventInput.edata, mockEventInput.options);
    });

    it('calls exData with correct arguments', () => {
      telemetryService.exData(mockEventInput);
      expect($t.exdata).toHaveBeenCalledWith(mockEventInput.edata, mockEventInput.options);
    });

    it('calls feedback with correct arguments', () => {
      telemetryService.feedback(mockEventInput);
      expect($t.feedback).toHaveBeenCalledWith(mockEventInput.edata, mockEventInput.options);
    });

    describe('impression tracking', () => {
      let nowMock: any;

      beforeEach(() => {
        // Mock Date.now() to control time in tests
        nowMock = vi.spyOn(Date, 'now').mockImplementation(() => 100000);
      });

      afterEach(() => {
        nowMock.mockRestore();
      });

      it('calls impression immediately if no pageid is provided', () => {
        const inputWithoutPageId = { edata: { type: 'view' } };
        telemetryService.impression(inputWithoutPageId);
        expect($t.impression).toHaveBeenCalledWith(inputWithoutPageId.edata, undefined);
      });

      it('calls impression immediately and tracks time if pageid is provided for the first time', () => {
        const inputWithPageId = { edata: { type: 'view', pageid: 'home-page' } };
        telemetryService.impression(inputWithPageId);
        expect($t.impression).toHaveBeenCalledWith(inputWithPageId.edata, undefined);
        expect(sessionStorage.getItem('telemetry_last_pageid')).toBe('home-page');
        expect(sessionStorage.getItem('telemetry_last_impression_time')).toBe('100000');
      });

      it('drops impression if it occurs within 5000ms for the same pageid', () => {
        const inputWithPageId = { edata: { type: 'view', pageid: 'home-page' } };
        
        telemetryService.impression(inputWithPageId);
        expect($t.impression).toHaveBeenCalledTimes(1);

        // Advance time by 2000ms (less than 5000ms threshold)
        nowMock.mockImplementation(() => 102000);
        
        telemetryService.impression(inputWithPageId);
        expect($t.impression).toHaveBeenCalledTimes(1); // Should still be 1 (event dropped)
      });

      it('fires impression if it occurs after 5000ms for the same pageid', () => {
        const inputWithPageId = { edata: { type: 'view', pageid: 'home-page' } };
        
        telemetryService.impression(inputWithPageId);
        expect($t.impression).toHaveBeenCalledTimes(1);

        // Advance time by 6000ms (greater than 5000ms threshold)
        nowMock.mockImplementation(() => 106000);
        
        telemetryService.impression(inputWithPageId);
        expect($t.impression).toHaveBeenCalledTimes(2); // Should be called again
        expect(sessionStorage.getItem('telemetry_last_impression_time')).toBe('106000');
      });

      it('handles invalid timestamp in sessionStorage gracefully and updates it', () => {
         const inputWithPageId = { edata: { type: 'view', pageid: 'home-page' } };
         sessionStorage.setItem('telemetry_last_pageid', 'home-page');
         sessionStorage.setItem('telemetry_last_impression_time', 'invalid');
         
         telemetryService.impression(inputWithPageId);
         expect($t.impression).toHaveBeenCalledTimes(1);
         expect(sessionStorage.getItem('telemetry_last_impression_time')).toBe('100000');
      });

      it('fires impression immediately if navigating to a different pageid within 5000ms', () => {
        const inputPageOne = { edata: { type: 'view', pageid: 'home-page' } };
        const inputPageTwo = { edata: { type: 'view', pageid: 'explore-page' } };
        
        telemetryService.impression(inputPageOne);
        expect($t.impression).toHaveBeenCalledTimes(1);

        // Advance time by 1000ms
        nowMock.mockImplementation(() => 101000);
        
        telemetryService.impression(inputPageTwo);
        expect($t.impression).toHaveBeenCalledTimes(2); 
        expect(sessionStorage.getItem('telemetry_last_pageid')).toBe('explore-page');
        expect(sessionStorage.getItem('telemetry_last_impression_time')).toBe('101000');
      });
    });
  });
});
