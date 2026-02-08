import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Request } from 'express';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import { saveSession } from '../utils/sessionUtils.js';

interface Organization {
    id: string;
    slug: string;
    hashTagId?: string;
    channel?: string;
}

/**
 * Fetch default organization by slug
 * @param slug - Organization slug
 * @param bearerToken - Authorization token
 * @returns Organization details
 */
export const getDefaultOrg = async (
    slug: string,
    bearerToken: string
): Promise<Organization> => {
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

        logger.info('Organization fetched successfully', { orgId: org.id, slug: org.slug });
        return org;
    } catch (error: any) {
        logger.error('Failed to fetch organization', { error: error.message, slug });
        throw error;
    }
};

/**
 * Set organization information to session
 * @param req - Express request object
 * @param org - Organization details
 */
export const setOrgToSession = (req: Request, org: Organization): void => {
    req.session.rootOrghashTagId = org.hashTagId || org.channel;
    logger.info('Organization set to session', { orgId: org.id, slug: org.slug });
};

/**
 * Save session with organization data
 * @param req - Express request object
 */
export const saveOrgSession = async (req: Request): Promise<void> => {
    await saveSession(req);
    logger.info('Organization session saved');
};
