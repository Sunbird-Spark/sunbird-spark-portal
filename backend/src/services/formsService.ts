import { getFormsClient } from '../databases/formsDatabase.js';
import { logger } from '../utils/logger.js';
import cassandra from 'cassandra-driver';

export class FormService {
    private client: cassandra.Client;

    constructor() {
        this.client = getFormsClient();
    }

    public async create(data: Record<string, unknown>) {
        logger.info('FormService.create - Input data:', JSON.stringify(data, null, 2));
        const rootOrgId = (data.rootOrgId as string) || '*';
        const framework = (data.framework as string) || '*';
        const subType = (data.subType as string) || '*';
        const component = (data.component as string) || '*';

        const query = `
            INSERT INTO form_data (root_org, type, subtype, action, component, framework, data, created_on)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            IF NOT EXISTS
        `;
        const params = [
            rootOrgId,
            data.type,
            subType,
            data.action,
            component,
            framework,
            JSON.stringify(data.data),
            new Date()
        ];
        logger.info('FormService.create - Query params:', params);
        await this.client.execute(query, params, { prepare: true });
        logger.info('FormService.create - Success!');
        return { created: 'OK' };
    }

    public async update(queryCtx: Record<string, unknown>, updateValue: Record<string, unknown>) {
        const query = `
            UPDATE form_data 
            SET data = ?, last_modified_on = ?
            WHERE root_org = ? AND framework = ? AND type = ? AND action = ? AND subtype = ? AND component = ?
            IF EXISTS
        `;

        const params = [
            updateValue.data,
            updateValue.last_modified_on,
            queryCtx.root_org,
            queryCtx.framework,
            queryCtx.type,
            queryCtx.action,
            queryCtx.subtype,
            queryCtx.component
        ];

        const result = await this.client.execute(query, params, { prepare: true });

        // In Cassandra, if IF EXISTS condition fails, applied is false
        if (!result.wasApplied()) {
            const error = new Error(`invalid request, no records found for the match to update!`) as Error & { statusCode: number; msg: string };
            error.statusCode = 404;
            error.msg = error.message;
            throw error;
        }
        return {
            rootOrgId: queryCtx.root_org,
            key: `${queryCtx.type}.${queryCtx.subtype}.${queryCtx.action}.${queryCtx.component}`,
            status: "SUCCESS"
        };
    }

    public async read(queryCtx: Record<string, unknown>) {
        const baseQuery = `SELECT * FROM form_data WHERE type = ? AND action = ? AND subtype = ? AND root_org = ? AND framework = ? AND component = ?`;

        // Define priority order for fallback
        // 1. Specific: root_org, framework, component
        // 2. root_org, *, component
        // 3. *, framework, component
        // 4. *, *, component
        // 5. *, *, *

        const combinations = [
            { root_org: queryCtx.root_org, framework: queryCtx.framework, component: queryCtx.component },
            { root_org: queryCtx.root_org, framework: '*', component: queryCtx.component },
            { root_org: '*', framework: queryCtx.framework, component: queryCtx.component },
            { root_org: '*', framework: '*', component: queryCtx.component },
            { root_org: '*', framework: '*', component: '*' }
        ];

        for (const combo of combinations) {
            const params = [
                queryCtx.type,
                queryCtx.action,
                queryCtx.subtype,
                combo.root_org,
                combo.framework,
                combo.component
            ];

            const result = await this.client.execute(baseQuery, params, { prepare: true });
            if (result.rowLength > 0) {
                return result.first();
            }
        }

        return null;
    }

    public async listAll(rootOrgId: string) {
        if (!rootOrgId || typeof rootOrgId !== 'string' || rootOrgId.trim().length === 0) {
            const error = new Error('rootOrgId must be a non-empty string') as Error & { statusCode: number; msg: string };
            error.statusCode = 400;
            error.msg = error.message;
            throw error;
        }

        const query = `
            SELECT type, subtype, action, root_org, framework, data, component 
            FROM form_data 
            WHERE root_org = ?
        `;
        const params = [rootOrgId];

        const result = await this.client.execute(query, params, { prepare: true });
        return result.rows;
    }
}
