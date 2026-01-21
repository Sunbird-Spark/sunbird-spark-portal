const { Client } = require('yb-ycql-driver');
const util = require('util');

if (!util.isDate) util.isDate = (d) => d instanceof Date;
if (!util.isArray) util.isArray = Array.isArray;

async function init() {
    const client = new Client({
        contactPoints: ['localhost'],
        localDataCenter: 'datacenter1',
        protocolOptions: { port: 9042 }
    });

    await client.connect();
    console.log('✅ Connected');

    await client.execute("CREATE KEYSPACE IF NOT EXISTS form_service WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1}");
    console.log('✅ Keyspace created');

    await client.execute(`CREATE TABLE IF NOT EXISTS form_service.form_data (type varchar, subtype varchar, action varchar, component varchar, root_org varchar, framework varchar, data varchar, created_on timestamp, last_modified_on timestamp, PRIMARY KEY ((root_org, framework, type, subtype, action, component)))`);
    console.log('✅ Table created');

    await client.shutdown();
    process.exit(0);
}

init().catch(console.error);
