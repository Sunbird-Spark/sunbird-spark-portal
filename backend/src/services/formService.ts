import { ysqlPool } from '../utils/sessionStore.js';

export class FormService {

    public async create(data: Record<string, unknown>) {
        console.log('FormService.create - Input data:', JSON.stringify(data, null, 2));
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
            data.data,
            new Date()
        ];
        console.log('FormService.create - Query params:', params);
        await ysqlPool.query(query, params);
        console.log('FormService.create - Success!');
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

        const result = await ysqlPool.query(query, params);

        if (result.rowCount === 0) {
            throw { msg: `invalid request, no records found for the match to update!`, statusCode: 404 };
        }

        return {
            rootOrgId: queryCtx.root_org,
            key: `${queryCtx.type}.${queryCtx.subtype}.${queryCtx.action}.${queryCtx.component}`,
            status: "SUCCESS"
        };
    }

    private async findOne(queryCtx: Record<string, unknown>): Promise<Record<string, unknown> | null> {
        const query = `
            SELECT * FROM form_data 
            WHERE root_org = $1 AND framework = $2 AND type = $3 AND action = $4 AND subtype = $5 AND component = $6
        `;
        const params = [
            queryCtx.root_org,
            queryCtx.framework,
            queryCtx.type,
            queryCtx.action,
            queryCtx.subtype,
            queryCtx.component
        ];

        const result = await ysqlPool.query(query, params);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        return null;
    }

    public async read(queryCtx: Record<string, unknown>) {
        let data = await this.findOne(queryCtx);
        if (data) return data;

        data = await this.findOne({ ...queryCtx, framework: "*" });
        if (data) return data;

        data = await this.findOne({ ...queryCtx, root_org: "*" });
        if (data) return data;

        data = await this.findOne({ ...queryCtx, root_org: "*", framework: "*" });
        if (data) return data;

        data = await this.findOne({ ...queryCtx, root_org: "*", framework: "*", component: "*" });
        return data;
    }

    public async listAll(rootOrgId: string) {
        const query = `
            SELECT type, subtype, action, root_org, framework, data, component 
            FROM form_data 
            WHERE root_org = $1
        `;
        const params = [rootOrgId || '*'];

        const result = await ysqlPool.query(query, params);
        return result.rows;
    }
}
