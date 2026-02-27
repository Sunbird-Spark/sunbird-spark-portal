import cassandra from 'cassandra-driver';
import { envConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

let _reviewCommentClient: cassandra.Client | null = null;

export const getReviewCommentClient = (): cassandra.Client => {
    if (!_reviewCommentClient) {
        const host = (envConfig.SUNBIRD_YUGABYTE_HOST || '').trim();
        const contactPoints = [host];
        logger.debug(`DEBUG: ReviewCommentDatabase connecting to: ${JSON.stringify(contactPoints)}:${envConfig.SUNBIRD_YUGABYTE_YCQL_PORT}`);

        if (!host) {
            logger.warn('Review Comment DB host not configured. Review Comment APIs will return SERVER_ERROR until SUNBIRD_YUGABYTE_HOST is set.');
            const noopClient = {
                execute: async () => {
                    const err = new Error('Review Comment database not configured (SUNBIRD_YUGABYTE_HOST is empty)') as Error & { statusCode: number; msg: string };
                    err.statusCode = 500;
                    err.msg = err.message;
                    throw err;
                }
            } as unknown as cassandra.Client;
            _reviewCommentClient = noopClient;
        } else {
            _reviewCommentClient = new cassandra.Client({
                contactPoints: contactPoints,
                localDataCenter: 'datacenter1',
                keyspace: envConfig.CONTENT_REVIEW_COMMENT_DB_NAME,
                protocolOptions: { port: envConfig.SUNBIRD_YUGABYTE_YCQL_PORT },
                credentials: {  
                    username: envConfig.SUNBIRD_YUGABYTE_USER,
                    password: envConfig.SUNBIRD_YUGABYTE_PASSWORD,
                },
            });

            logger.info('Review Comment database (Cassandra/YCQL) client initialized (lazy connection).');
        }
    }
    return _reviewCommentClient;
};
