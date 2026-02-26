import { getReviewCommentClient } from '../databases/reviewCommentDatabase.js';
import { logger } from '../utils/logger.js';
import { envConfig } from '../config/env.js';
import cassandra from 'cassandra-driver';

interface ContextDetails {
    contentId: string;
    contentVer: string;
    contentType: string;
    stageId?: string;
}

interface CommentData {
    contextDetails: ContextDetails;
    body?: string;
    userId?: string;
    userInfo?: {
        name: string;
        logo?: string;
    };
}

export class ReviewCommentService {
    private client: cassandra.Client;
    private keyspace: string;

    constructor() {
        this.client = getReviewCommentClient();
        this.keyspace = envConfig.REVIEW_COMMENT_DB_NAME || 'apzvp_review_comment';
    }

    public async createComment(data: CommentData) {
        logger.info('ReviewCommentService.createComment - Input data:', JSON.stringify(data, null, 2));

        const query = `
            INSERT INTO ${this.keyspace}.context_details (content_id, content_ver, content_type, thread_id, meta_data, is_deleted, created_on)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const threadId = cassandra.types.Uuid.random().toString();
        const metaData: Record<string, string> = {
            body: data.body || '',
            user_id: data.userId || '',
            user_name: data.userInfo?.name || '',
        };
        
        if (data.contextDetails.stageId) {
            metaData.stage_id = data.contextDetails.stageId;
        }
        
        if (data.userInfo?.logo) {
            metaData.user_logo = data.userInfo.logo;
        }

        const params = [
            data.contextDetails.contentId,
            data.contextDetails.contentVer,
            data.contextDetails.contentType,
            threadId,
            metaData,
            false,
            new Date()
        ];

        logger.info('ReviewCommentService.createComment - Query params:', params);
        await this.client.execute(query, params, { prepare: true });
        logger.info('ReviewCommentService.createComment - Success!');

        return { created: 'OK', threadId };
    }

    public async readComments(contextDetails: ContextDetails) {
        logger.info('ReviewCommentService.readComments - Input:', JSON.stringify(contextDetails, null, 2));

        let query = `
            SELECT * FROM ${this.keyspace}.context_details 
            WHERE content_id = ? AND content_ver = ? AND content_type = ? AND is_deleted = false
            ALLOW FILTERING
        `;

        const params: unknown[] = [
            contextDetails.contentId,
            contextDetails.contentVer,
            contextDetails.contentType
        ];

        const result = await this.client.execute(query, params, { prepare: true });
        logger.info('ReviewCommentService.readComments - Found rows:', result.rowLength);

        const comments = result.rows
            .filter(row => !contextDetails.stageId || row.meta_data?.stage_id === contextDetails.stageId)
            .map(row => ({
                identifier: row.thread_id,
                comment: row.meta_data?.body || '',
                createdBy: row.meta_data?.user_name || 'Unknown',
                createdOn: row.created_on?.toISOString() || new Date().toISOString(),
                stageId: row.meta_data?.stage_id,
                userId: row.meta_data?.user_id
            }));

        return comments;
    }

    public async deleteComments(contextDetails: ContextDetails) {
        logger.info('ReviewCommentService.deleteComments - Input:', JSON.stringify(contextDetails, null, 2));

        // First, read all thread_ids for this content
        const selectQuery = `
            SELECT thread_id FROM ${this.keyspace}.context_details 
            WHERE content_id = ? AND content_ver = ? AND content_type = ?
        `;

        const selectParams = [
            contextDetails.contentId,
            contextDetails.contentVer,
            contextDetails.contentType
        ];

        const result = await this.client.execute(selectQuery, selectParams, { prepare: true });
        logger.info('ReviewCommentService.deleteComments - Found rows to delete:', result.rowLength);

        // Update each row individually with thread_id in WHERE clause
        const updateQuery = `
            UPDATE ${this.keyspace}.context_details 
            SET is_deleted = true
            WHERE content_id = ? AND content_ver = ? AND content_type = ? AND thread_id = ?
        `;

        const updatePromises = result.rows.map(row => {
            const updateParams = [
                contextDetails.contentId,
                contextDetails.contentVer,
                contextDetails.contentType,
                row.thread_id
            ];
            return this.client.execute(updateQuery, updateParams, { prepare: true });
        });

        await Promise.all(updatePromises);
        logger.info('ReviewCommentService.deleteComments - Success!');

        return { deleted: 'OK', count: result.rowLength };
    }
}
