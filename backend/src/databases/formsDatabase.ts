import cassandra from 'cassandra-driver';
import { envConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getYcqlClientOptions } from './yugabyteConfig.js';

let _formsClient: cassandra.Client | null = null;

export const getFormsClient = (): cassandra.Client => {
    if (!_formsClient) {
        const options = getYcqlClientOptions(envConfig.FORMS_DB_NAME);
        logger.debug(`DEBUG: FormsDatabase connecting to: ${JSON.stringify(options.contactPoints)}:${envConfig.SUNBIRD_YUGABYTE_YCQL_PORT}`);

        _formsClient = new cassandra.Client(options);

        // Lazy connection: The driver will connect automatically on the first query execution.
        // No explicit connect() call is needed here, preventing race conditions.
        logger.info('Forms database (Cassandra/YCQL) client initialized (lazy connection).');
    }
    return _formsClient;
};
