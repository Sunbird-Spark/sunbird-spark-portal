import { Request } from 'express';
import { generateTelemetryStart, generateTelemetryEnd, dispatchTelemetry } from './telemetryService.js';
import axios from 'axios';
import { envConfig } from '../config/env.js';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

vi.mock('axios');
vi.mock('uuid', () => ({ v4: vi.fn(() => 'mock-uuid') }));

describe('Telemetry Service', () => {
    let req: Partial<Request>;

    beforeEach(() => {
        req = {
            sessionID: 'mock-session-id',
            session: {
                userId: 'mock-user-id',
                rootOrghashTagId: 'mock-channel'
            } as any,
            headers: {
                'x-device-id': 'mock-device-id'
            },
            get: vi.fn().mockReturnValue(undefined)
        };
        vi.clearAllMocks();
    });

    it('should generate a valid START event', () => {
        const startEvent = generateTelemetryStart(req as Request);
        expect(startEvent.eid).toBe('START');
        expect(startEvent.actor.id).toBe('mock-user-id');
        expect(startEvent.context.channel).toBe('mock-channel');
        expect(startEvent.context.pdata.id).toBe(envConfig.APPID);
        expect(startEvent.context.did).toBe('mock-device-id');
        expect(startEvent.context.sid).toBe('mock-session-id');
        expect(startEvent.edata.type).toBe('app');
        expect(startEvent.edata.mode).toBe('session');
    });

    it('should generate a valid END event', () => {
        const endEvent = generateTelemetryEnd(req as Request);
        expect(endEvent.eid).toBe('END');
        expect(endEvent.actor.id).toBe('mock-user-id');
        expect(endEvent.edata.pageid).toBe('logout-success');
    });

    it('should dispatch telemetry events via POST', async () => {
        (axios.post as Mock).mockResolvedValue({ status: 200 });
        const events = [{ eid: 'START' }];
        await dispatchTelemetry(req as Request, events);

        expect(axios.post).toHaveBeenCalled();
        const callArgs = (axios.post as Mock).mock.calls[0]!;
        expect(callArgs[0]).toBe(`${envConfig.KONG_URL}/data/v3/telemetry`);
        expect(callArgs[1].events).toEqual(events);
        expect(callArgs[1].id).toBe('api.telemetry');
    });
});
