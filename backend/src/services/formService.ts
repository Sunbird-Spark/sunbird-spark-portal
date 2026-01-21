import { getCassandraClient } from '../utils/cassandraConnection.js';
import _ from 'lodash';

export class FormService {

    async create(data: any) {
        console.log('FormService.create - Input data:', JSON.stringify(data, null, 2));
        const rootOrgId = data.rootOrgId || '*';
        const framework = data.framework || '*';
        const subType = data.subType || '*';
        const component = data.component || '*';

        const client = await getCassandraClient();
        const query = `
      INSERT INTO form_data (root_org, type, subtype, action, component, framework, data, created_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        console.log('FormService.create - Query params:', params);
        await client.execute(query, params, { prepare: true });
        console.log('FormService.create - Success!');
        return { created: 'OK' };
    }

    async update(queryCtx: any, updateValue: any) {
        const client = await getCassandraClient();
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

        const result = await client.execute(query, params, { prepare: true });

        const row = result.first();
        const applied = row ? row['[applied]'] : false;

        if (!applied) {
            throw { msg: `invalid request, no records found for the match to update!`, client_error: true };
        }

        return {
            rootOrgId: queryCtx.root_org,
            key: `${queryCtx.type}.${queryCtx.subtype}.${queryCtx.action}.${queryCtx.component}`,
            status: "SUCCESS"
        };
    }

    private async findOne(queryCtx: any): Promise<any> {
        const client = await getCassandraClient();
        const query = `
      SELECT * FROM form_data 
      WHERE root_org = ? AND framework = ? AND type = ? AND action = ? AND subtype = ? AND component = ?
    `;
        const params = [
            queryCtx.root_org,
            queryCtx.framework,
            queryCtx.type,
            queryCtx.action,
            queryCtx.subtype,
            queryCtx.component
        ];

        const result = await client.execute(query, params, { prepare: true });
        if (result.rowLength > 0) {
            return result.first();
        }
        return null;
    }

    async read(queryCtx: any) {
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

    async listAll(rootOrgId: string) {
        const client = await getCassandraClient();
        const query = `
      SELECT type, subtype, action, root_org, framework, data, component 
      FROM form_data 
      WHERE root_org = ? 
      ALLOW FILTERING
    `;
        const params = [rootOrgId || '*'];

        const result = await client.execute(query, params, { prepare: true });
        return result.rows;
    }
}
