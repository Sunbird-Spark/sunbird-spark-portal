import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TncService } from './TncService';
import { getClient } from '../lib/http-client';

vi.mock('../lib/http-client', () => ({
    getClient: vi.fn(),
}));

describe('TncService', () => {
    let tncService: TncService;
    let mockPost: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        tncService = new TncService();
        mockPost = vi.fn();
        vi.mocked(getClient).mockReturnValue({
            post: mockPost,
        } as unknown as import('../lib/http-client').IHttpClient);
    });

    describe('getTncUrl', () => {
        it('returns empty string when tncConfig is null', () => {
            const result = tncService.getTncUrl(null);
            expect(result).toBe('');
        });

        it('returns empty string when tncConfig.data is undefined', () => {
            const result = tncService.getTncUrl({});
            expect(result).toBe('');
        });

        it('returns empty string when value is missing', () => {
            const tncConfig = {
                data: {
                    response: {}
                }
            };
            const result = tncService.getTncUrl(tncConfig);
            expect(result).toBe('');
        });

        it('returns URL when value is a valid JSON string', () => {
            const tncConfig = {
                data: {
                    response: {
                        value: JSON.stringify({
                            latestVersion: 'v1',
                            v1: {
                                url: 'https://example.com/terms'
                            }
                        })
                    }
                }
            };
            const result = tncService.getTncUrl(tncConfig);
            expect(result).toBe('https://example.com/terms');
        });

        it('returns URL when value is already an object', () => {
            const tncConfig = {
                data: {
                    response: {
                        value: {
                            latestVersion: 'v2',
                            v2: {
                                url: 'https://example.com/terms-v2'
                            }
                        }
                    }
                }
            };
            const result = tncService.getTncUrl(tncConfig);
            expect(result).toBe('https://example.com/terms-v2');
        });

        it('returns empty string when JSON parsing fails', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const tncConfig = {
                data: {
                    response: {
                        value: 'invalid json'
                    }
                }
            };
            const result = tncService.getTncUrl(tncConfig);
            expect(result).toBe('');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse TNC config:', expect.any(Error));
            consoleErrorSpy.mockRestore();
        });

        it('returns empty string when latestVersion is missing', () => {
            const tncConfig = {
                data: {
                    response: {
                        value: {
                            v1: {
                                url: 'https://example.com/terms'
                            }
                        }
                    }
                }
            };
            const result = tncService.getTncUrl(tncConfig);
            expect(result).toBe('');
        });

        it('returns empty string when version URL is missing', () => {
            const tncConfig = {
                data: {
                    response: {
                        value: {
                            latestVersion: 'v1',
                            v1: {}
                        }
                    }
                }
            };
            const result = tncService.getTncUrl(tncConfig);
            expect(result).toBe('');
        });
    });

    describe('getLatestVersion', () => {
        it('returns empty string when tncConfig is null', () => {
            const result = tncService.getLatestVersion(null);
            expect(result).toBe('');
        });

        it('returns empty string when value is missing', () => {
            const tncConfig = {
                data: {
                    response: {}
                }
            };
            const result = tncService.getLatestVersion(tncConfig);
            expect(result).toBe('');
        });

        it('returns version when value is a valid JSON string', () => {
            const tncConfig = {
                data: {
                    response: {
                        value: JSON.stringify({
                            latestVersion: 'v1'
                        })
                    }
                }
            };
            const result = tncService.getLatestVersion(tncConfig);
            expect(result).toBe('v1');
        });

        it('returns version when value is already an object', () => {
            const tncConfig = {
                data: {
                    response: {
                        value: {
                            latestVersion: 'v2'
                        }
                    }
                }
            };
            const result = tncService.getLatestVersion(tncConfig);
            expect(result).toBe('v2');
        });

        it('returns empty string when JSON parsing fails', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const tncConfig = {
                data: {
                    response: {
                        value: 'invalid json'
                    }
                }
            };
            const result = tncService.getLatestVersion(tncConfig);
            expect(result).toBe('');
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it('returns empty string when latestVersion is missing', () => {
            const tncConfig = {
                data: {
                    response: {
                        value: {
                            v1: {
                                url: 'https://example.com/terms'
                            }
                        }
                    }
                }
            };
            const result = tncService.getLatestVersion(tncConfig);
            expect(result).toBe('');
        });
    });

    describe('acceptTnc', () => {
        it('calls API with correct version and identifier', async () => {
            const tncConfig = {
                data: {
                    response: {
                        value: {
                            latestVersion: 'v1'
                        }
                    }
                }
            };
            const identifier = 'user@example.com';
            const mockResponse = { data: { success: true } };
            mockPost.mockResolvedValue(mockResponse);

            const result = await tncService.acceptTnc(tncConfig, identifier);

            expect(mockPost).toHaveBeenCalledWith('/user/v1/tnc/accept', {
                version: 'v1',
                identifier: 'user@example.com',
            });
            expect(result).toEqual(mockResponse);
        });

        it('calls API with empty version when config is invalid', async () => {
            const tncConfig = null;
            const identifier = 'user@example.com';
            const mockResponse = { data: { success: false } };
            mockPost.mockResolvedValue(mockResponse);

            const result = await tncService.acceptTnc(tncConfig, identifier);

            expect(mockPost).toHaveBeenCalledWith('/user/v1/tnc/accept', {
                version: '',
                identifier: 'user@example.com',
            });
            expect(result).toEqual(mockResponse);
        });

        it('handles API errors', async () => {
            const tncConfig = {
                data: {
                    response: {
                        value: {
                            latestVersion: 'v1'
                        }
                    }
                }
            };
            const identifier = 'user@example.com';
            const error = new Error('API Error');
            mockPost.mockRejectedValue(error);

            await expect(tncService.acceptTnc(tncConfig, identifier)).rejects.toThrow('API Error');
        });
    });
});
