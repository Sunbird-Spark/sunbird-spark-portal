import { describe, it, expect, vi } from 'vitest';
import { BaseClient } from './BaseClient';
import { ApiResponse, HeaderOperation } from './types';

class TestClient extends BaseClient {
    public mockGet = vi.fn();
    public mockPost = vi.fn();
    public mockPut = vi.fn();
    public mockDelete = vi.fn();
    public mockUpdateHeaders = vi.fn();

    protected async _get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.mockGet(url, headers);
    }
    protected async _post<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.mockPost(url, data, headers);
    }
    protected async _put<T>(url: string, data: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.mockPut(url, data, headers);
    }
    protected async _delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.mockDelete(url, headers);
    }
    public updateHeaders(headers: HeaderOperation[]): void {
        this.mockUpdateHeaders(headers);
    }
}

describe('BaseClient', () => {
    it('should trigger status handlers on response', async () => {
        const handler401 = vi.fn();
        const client = new TestClient({
            statusHandlers: {
                401: handler401
            }
        });

        const mockResponse: ApiResponse<any> = {
            data: null,
            status: 401,
            headers: {}
        };

        client.mockGet.mockResolvedValue(mockResponse);

        await client.get('/test');

        expect(handler401).toHaveBeenCalledWith(mockResponse);
    });

    it('should call internal methods and return response', async () => {
        const client = new TestClient({});
        const mockResponse: ApiResponse<string> = {
            data: 'test-data',
            status: 200,
            headers: {}
        };

        client.mockGet.mockResolvedValue(mockResponse);
        const resGet = await client.get<string>('/get');
        expect(resGet).toEqual(mockResponse);

        client.mockPost.mockResolvedValue(mockResponse);
        const resPost = await client.post<string>('/post', { foo: 'bar' });
        expect(resPost).toEqual(mockResponse);

        client.mockPut.mockResolvedValue(mockResponse);
        const resPut = await client.put<string>('/put', { foo: 'bar' });
        expect(resPut).toEqual(mockResponse);

        client.mockDelete.mockResolvedValue(mockResponse);
        const resDelete = await client.delete<string>('/delete');
        expect(resDelete).toEqual(mockResponse);
    });
});
