import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { FormService } from './formsService.js';
import { logger } from '../utils/logger.js';

// Mock logger
vi.mock('../utils/logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }
}));

// Mock the new formsDatabase
vi.mock('../databases/formsDatabase.js', () => {
    const mockFormsClient = {
        execute: vi.fn((query: string, params: unknown[]) => {
            // Helper to create a mock ResultSet
            const createResult = (rows: Record<string, unknown>[], wasApplied = true) => ({
                rows,
                rowLength: rows.length,
                first: () => {
                    const row = rows[0];
                    if (!row) return null;
                    // Add Row-like methods to the object
                    return {
                        ...row,
                        get: (key: string) => row[key],
                        // eslint-disable-next-line no-unused-vars
                        forEach: (callback: (value: unknown, key: string) => void) => {
                            Object.keys(row).forEach(key => callback(row[key], key));
                        },
                        keys: () => Object.keys(row),
                        values: () => Object.values(row)
                    };
                },
                wasApplied: () => wasApplied
            });

            console.log('Mock EXECUTE QUERY:', query); // Debug log

            if (query.includes('INSERT INTO form_data')) {
                return createResult([]);
            }
            if (query.includes('UPDATE form_data')) {
                // Determine if it should fail (simulate IF EXISTS failure)
                // For testing, we can use a specific param to trigger failure or mock differently per test
                // Here we assume success by default
                return createResult([], true);
            }
            if (query.includes('SELECT * FROM form_data')) {
                const type = params[0] as string;
                if (type === 'invalid') return createResult([]);
                return createResult([{
                    root_org: 'org1',
                    type: 'type1',
                    subtype: 'subtype1',
                    action: 'action1',
                    component: 'component1',
                    framework: 'framework1',
                    data: '{"some":"data"}'
                }]);
            }
            // Check for listAll query more broadly
            if (query.includes('FROM form_data') && query.includes('SELECT type, subtype')) {
                const rootOrg = params[0] as string;
                if (rootOrg === 'empty') return createResult([]);
                return createResult([
                    { type: 't1', subtype: 's1', action: 'a1', component: 'c1' },
                    { type: 't2', subtype: 's2', action: 'a2', component: 'c2' }
                ]);
            }
            return createResult([]);
        }),
    };
    return {
        getFormsClient: () => mockFormsClient
    };
});

describe('FormService', () => {
    let formService: FormService;

    beforeEach(() => {
        formService = new FormService();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('create', () => {
        it('should create a form successfully', async () => {
            const data = {
                rootOrgId: 'org1',
                framework: 'framework1',
                type: 'type1',
                subType: 'subtype1',
                action: 'action1',
                component: 'component1',
                data: { some: 'data' }
            };

            const result = await formService.create(data);

            expect(result).toEqual({ created: 'OK' });
            expect(logger.info).toHaveBeenCalledWith('FormService.create - Success!');
        });

        it('should handle missing optional fields by using wildcard *', async () => {
            const data = {
                type: 'type1',
                action: 'action1',
                data: { some: 'data' }
            } as Record<string, unknown>; // Cast to valid Partial input for test

            const result = await formService.create(data);

            expect(result).toEqual({ created: 'OK' });
            // Verify query params contain * for missing fields
            // The params array index: 0=rootOrg, 2=subType, 4=component, 5=framework
            // Accessing the mock call:
            // @ts-ignore
            const calls = (formService['client'].execute as Mock).mock.calls;
            if (!calls[0]) throw new Error('Mock execute was not called'); // Guards against undefined
            const params = calls[0][1] as string[];
            expect(params[0]).toBe('*'); // rootOrg
            expect(params[2]).toBe('*'); // subType
            expect(params[4]).toBe('*'); // component
            expect(params[5]).toBe('*'); // framework
        });
    });

    describe('update', () => {
        it('should update a form successfully', async () => {
            const queryCtx = {
                root_org: 'org1',
                framework: 'framework1',
                type: 'type1',
                action: 'action1',
                subtype: 'subtype1',
                component: 'component1'
            };
            const updateValue = {
                data: JSON.stringify({ newData: 'value' }),
                last_modified_on: new Date()
            };

            const result = await formService.update(queryCtx, updateValue);

            expect(result).toEqual({
                rootOrgId: 'org1',
                key: 'type1.subtype1.action1.component1',
                status: 'SUCCESS'
            });
        });

        it('should throw error if update was not applied (IF EXISTS failed)', async () => {
            // Mock wasApplied to return false for this test
            // We need to override the mock implementation for this specific test
            // @ts-ignore
            const mockExecute = formService['client'].execute as Mock;
            mockExecute.mockResolvedValueOnce({
                wasApplied: () => false
            });

            const queryCtx = { root_org: 'org1' } as Record<string, unknown>;
            const updateValue = { data: '{}' } as Record<string, unknown>;

            await expect(formService.update(queryCtx, updateValue)).rejects.toThrow('invalid request, no records found for the match to update!');
        });
    });

    describe('read', () => {
        it('should return form data when found', async () => {
            const validCtx = { root_org: 'org1', type: 'type1' } as Record<string, unknown>;
            const result = await formService.read(validCtx);

            expect(result).toBeDefined();
            expect(result?.get('type')).toBe('type1');
        });

        it('should return null when form data is not found (iterates combinations)', async () => {
            // Force mock to return empty rows for all calls
            // @ts-ignore
            const mockExecute = formService['client'].execute as Mock;
            mockExecute.mockResolvedValue({
                rowLength: 0,
                first: () => null,
                rows: []
            });

            const validCtx = { root_org: 'org1', type: 'type1' } as Record<string, unknown>;
            const result = await formService.read(validCtx);

            expect(result).toBeNull();
            // Should have tried 5 combinations
            expect(mockExecute).toHaveBeenCalledTimes(5);
        });
    });

    describe('listAll', () => {
        it('should list all forms for a rootOrgId', async () => {
            const rootOrgId = 'org1';
            const result = await formService.listAll(rootOrgId);

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('type', 't1');
            expect(result[1]).toHaveProperty('type', 't2');
        });

        it('should throw error if rootOrgId is invalid', async () => {
            await expect(formService.listAll('')).rejects.toThrow('rootOrgId must be a non-empty string');
            // @ts-ignore
            await expect(formService.listAll(null)).rejects.toThrow('rootOrgId must be a non-empty string');
        });
    });
});
