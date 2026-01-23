import { describe, it, expect } from 'vitest';
import { Response } from './Response.js';

describe('Response Model', () => {
    it('should set default server error if responseCode is missing', () => {
        const res = new Response('api.test');
        res.setError({ err: 'Some Error' }); // No responseCode
        expect(res.responseCode).toBe('SERVER_ERROR');
    });

    it('should use provided responseCode', () => {
        const res = new Response('api.test');
        res.setError({ err: 'Some Error', responseCode: 'CUSTOM_ERROR' });
        expect(res.responseCode).toBe('CUSTOM_ERROR');
    });

    it('should set result correctly', () => {
        const res = new Response('api.test');
        const data = { foo: 'bar' };
        res.setResult({ data });
        expect(res.result).toEqual(data);
        expect(res.params.status).toBe('successful');
    });

    it('should initialize with default version', () => {
        const res = new Response('api.test');
        expect(res.ver).toBe('1.0');
    });

    it('should allows overriding version', () => {
        const res = new Response('api.test', '2.0');
        expect(res.ver).toBe('2.0');
    });
});
