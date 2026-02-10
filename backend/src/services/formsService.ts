import { getYsqlPool } from '../utils/sessionStore.js';
import { logger } from '../utils/logger.js';

export class FormService {

    public async create(data: Record<string, unknown>) {
        logger.info('FormService.create - Input data:', JSON.stringify(data, null, 2));
        const rootOrgId = (data.rootOrgId as string) || '*';
        const framework = (data.framework as string) || '*';
        const subType = (data.subType as string) || '*';
        const component = (data.component as string) || '*';

        const query = `
            INSERT INTO form_data (root_org, type, subtype, action, component, framework, data, created_on)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (root_org, framework, type, subtype, action, component) DO NOTHING
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
        await getYsqlPool().query(query, params);
        logger.info('FormService.create - Success!');
        return { created: 'OK' };
    }

    public async update(queryCtx: Record<string, unknown>, updateValue: Record<string, unknown>) {
        const query = `
            UPDATE form_data
            SET data = $1, last_modified_on = $2
            WHERE root_org = $3 AND framework = $4 AND type = $5 AND action = $6 AND subtype = $7 AND component = $8
            RETURNING *
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

        const result = await getYsqlPool().query(query, params);

        if (result.rowCount === 0) {
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
        const query = `
            SELECT * FROM form_data
            WHERE type = $3 AND action = $4 AND subtype = $5
            AND (
                (root_org = $1 AND framework = $2 AND component = $6) OR
                (root_org = $1 AND framework = '*' AND component = $6) OR
                (root_org = '*' AND framework = $2 AND component = $6) OR
                (root_org = '*' AND framework = '*' AND component = $6) OR
                (root_org = '*' AND framework = '*' AND component = '*')
            )
            ORDER BY
                CASE
                    WHEN root_org = $1 AND framework = $2 AND component = $6 THEN 1
                    WHEN root_org = $1 AND framework = '*' AND component = $6 THEN 2
                    WHEN root_org = '*' AND framework = $2 AND component = $6 THEN 3
                    WHEN root_org = '*' AND framework = '*' AND component = $6 THEN 4
                    WHEN root_org = '*' AND framework = '*' AND component = '*' THEN 5
                    ELSE 6
                END ASC
            LIMIT 1
        `;

        const params = [
            queryCtx.root_org,
            queryCtx.framework,
            queryCtx.type,
            queryCtx.action,
            queryCtx.subtype,
            queryCtx.component
        ];

        const result = await getYsqlPool().query(query, params);
        return result.rows[0] || null;
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
            WHERE root_org = $1
        `;
        const params = [rootOrgId];

        const result = await getYsqlPool().query(query, params);
        return result.rows;
    }
}
