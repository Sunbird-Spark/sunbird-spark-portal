import { Client, auth } from 'yb-ycql-driver';
import logger from './logger.js';
import { envConfig } from '../config/env.js';
import util from 'util';

if (!(util as any).isDate) {
    (util as any).isDate = (d: any) => d instanceof Date;
}
if (!(util as any).isArray) {
    (util as any).isArray = Array.isArray;
}

let cassandraClient: Client | null = null;

export const getCassandraClient = async (): Promise<Client> => {
    if (cassandraClient) {
        return cassandraClient;
    }

    cassandraClient = new Client({
        contactPoints: [envConfig.SUNBIRD_YUGABYTE_HOST],
        keyspace: envConfig.SUNBIRD_YUGABYTE_KEYSPACE,
        localDataCenter: 'datacenter1',
        authProvider: new auth.PlainTextAuthProvider(
            envConfig.SUNBIRD_YUGABYTE_CQL_USER,
            envConfig.SUNBIRD_YUGABYTE_CQL_PASSWORD
        ),
        protocolOptions: {
            port: envConfig.SUNBIRD_YUGABYTE_CQL_PORT
        },
    });

    try {
        await cassandraClient.connect();
        logger.info('Connected to YugabyteDB via Cassandra driver');
    } catch (err) {
        logger.error('Error connecting to YugabyteDB', err);
        throw err;
    }

    return cassandraClient;
};

export default getCassandraClient;
