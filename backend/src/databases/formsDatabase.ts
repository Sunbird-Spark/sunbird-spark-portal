import pg from 'pg';
import { envConfig } from '../config/env.js';

let _formsPool: pg.Pool | null = null;

export const getFormsPool = (): pg.Pool => {
    if (!_formsPool) {
        _formsPool = new pg.Pool({
            host: envConfig.SUNBIRD_YUGABYTE_HOST,
            port: envConfig.SUNBIRD_YUGABYTE_PORT,
            database: envConfig.FORMS_DB_NAME,
            user: envConfig.SUNBIRD_YUGABYTE_USER,
            password: envConfig.SUNBIRD_YUGABYTE_PASSWORD,
        });
    }
    return _formsPool;
};
