import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Request } from 'express';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import { saveSession } from '../utils/sessionUtils.js';

/**
 * Fetch organization and store channel ID in session (for anonymous users)
 */
export const fetchAndSetAnonymousOrg = async (
    req: Request,
    slug: string,
    bearerToken: string
): Promise<void> => {
    try {
        const { data } = await axios.post(
            `${envConfig.KONG_URL}/api/org/v2/search`,
            { request: { filters: { slug: slug.trim(), isTenant: true } } },
            {
                headers: {
                    'x-msgid': uuidv4(),
                    ts: dayjs().format('YYYY-MM-DD HH:mm:ss:SSSZ'),
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${bearerToken}`,
                },
            }
        );

        if (data.responseCode !== 'OK') {
            throw new Error(`Failed to fetch organization: ${data.responseCode}`);
        }

        const org = data.result?.response?.content?.[0];
        if (!org) {
            throw new Error(`Organization not found for slug: ${slug}`);
        }

        req.session.rootOrghashTagId = org.hashTagId || org.channel;
        await saveSession(req);

        logger.info('Anonymous org session set', { orgId: org.id, slug: org.slug });
    } catch (error: any) {
        logger.error('Failed to fetch and set org', { error: error.message, slug });
        throw error;
    }
};
