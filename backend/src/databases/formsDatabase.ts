import cassandra from 'cassandra-driver';
import { envConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

let _formsClient: cassandra.Client | null = null;

export const getFormsClient = (): cassandra.Client => {
    if (!_formsClient) {
        const contactPoints = [envConfig.SUNBIRD_YUGABYTE_HOST];
        logger.info(`DEBUG: FormsDatabase connecting to: ${JSON.stringify(contactPoints)}:${envConfig.SUNBIRD_YUGABYTE_YCQL_PORT}`);

        _formsClient = new cassandra.Client({
            contactPoints: contactPoints,
            localDataCenter: 'datacenter1', // Default usage, adjust if needed
            keyspace: envConfig.FORMS_DB_NAME,
            protocolOptions: { port: envConfig.SUNBIRD_YUGABYTE_YCQL_PORT },
            credentials: {
                username: envConfig.SUNBIRD_YUGABYTE_USER,
                password: envConfig.SUNBIRD_YUGABYTE_PASSWORD,
            },
        });

        (async () => {
            try {
                await _formsClient!.connect();
                logger.info('Forms database (Cassandra/YCQL) connection test succeeded.');
            } catch (error) {
                logger.error('Forms database (Cassandra/YCQL) connection test failed:', error);
                if (process.env.NODE_ENV !== 'test') {
                    process.exit(1);
                }
            }
        })();
    }
    return _formsClient;
};
