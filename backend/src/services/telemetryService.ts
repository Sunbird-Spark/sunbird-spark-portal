import axios from 'axios';
import { Request } from 'express';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import { decorateRequestHeaders } from '../utils/proxyUtils.js';
import { v4 as uuidv4 } from 'uuid';
import * as http from 'http';

/**
 * Backend Telemetry Service
 * Emits Telemetry V3 events for global session tracking directly to Kong.
 */

// Helper to construct the base telemetry standard envelope
const buildTelemetryParams = (req: Request) => {
    return {
        did: req.headers['x-device-id'] as string || '',
        msgid: uuidv4(),
        uid: req.session?.userId || '',
        env: 'portal',
        sid: req.sessionID || '',
    };
};

// Helper for pdata
const getPData = () => {
    return {
        id: envConfig.APPID,
        pid: envConfig.APPID,
        ver: '1.0'
    };
};

export const generateTelemetryStart = (req: Request) => {
    const params = buildTelemetryParams(req);
    const startEvent = {
        eid: 'START',
        ets: Date.now(),
        ver: '3.0',
        mid: `START:${params.msgid}`,
        actor: {
            id: params.uid || 'anonymous',
            type: 'User'
        },
        context: {
            channel: req.session?.rootOrghashTagId || envConfig.APPID,
            pdata: getPData(),
            env: params.env,
            did: params.did,
            sid: params.sid
        },
        edata: {
            type: 'app',
            mode: 'session',
            pageid: 'login-success'
        }
    };
    return startEvent;
};

export const generateTelemetryEnd = (req: Request) => {
    const params = buildTelemetryParams(req);
    const endEvent = {
        eid: 'END',
        ets: Date.now(),
        ver: '3.0',
        mid: `END:${params.msgid}`,
        actor: {
            id: params.uid || 'anonymous',
            type: 'User'
        },
        context: {
            channel: req.session?.rootOrghashTagId || envConfig.APPID,
            pdata: getPData(),
            env: params.env,
            did: params.did,
            sid: params.sid
        },
        edata: {
            type: 'app',
            mode: 'session',
            pageid: 'logout-success'
        }
    };
    return endEvent;
};

export const dispatchTelemetry = async (req: Request, events: any[]) => {
    if (!events || events.length === 0) return;

    const payload = {
        id: 'api.telemetry',
        ver: '3.0',
        params: {
            msgid: uuidv4(),
        },
        ets: Date.now(),
        events: events
    };

    const telemetryUrl = `${envConfig.KONG_URL}/data/v3/telemetry`;

    try {
        // We use a mock ClientRequest to reuse decorateRequestHeaders logic
        // This ensures the X-Session-Id, etc. are passed precisely as the proxy does
        const mockClientReq = {
            headers: {} as Record<string, string>,
            setHeader: function(name: string, value: string) {
                this.headers[name] = value;
            }
        };
        decorateRequestHeaders(mockClientReq as unknown as http.ClientRequest, req);

        // Required headers for axios payload
        const headers = {
            ...mockClientReq.headers,
            'Content-Type': 'application/json'
        };

        const response = await axios.post(telemetryUrl, payload, { headers });
        logger.debug(`Telemetry dispatched successfully. Status: ${response.status}`);
    } catch (error: any) {
        logger.error(`Failed to dispatch telemetry to ${telemetryUrl}: ${error.message}`);
    }
};
