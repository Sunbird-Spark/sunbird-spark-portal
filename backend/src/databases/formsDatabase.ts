import cassandra from 'cassandra-driver';
import { envConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

let _formsClient: cassandra.Client | null = null;

export const getFormsClient = (): cassandra.Client => {
    if (!_formsClient) {
        const contactPoints = [envConfig.SUNBIRD_YUGABYTE_HOST];
        logger.debug(`DEBUG: FormsDatabase connecting to: ${JSON.stringify(contactPoints)}:${envConfig.SUNBIRD_YUGABYTE_YCQL_PORT}`);

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

        // Lazy connection: The driver will connect automatically on the first query execution.
        // No explicit connect() call is needed here, preventing race conditions.
        logger.info('Forms database (Cassandra/YCQL) client initialized (lazy connection).');
    }
    return _formsClient;
};
