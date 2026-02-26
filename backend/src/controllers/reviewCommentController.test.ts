import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { createComment, readComments, deleteComments } from './reviewCommentController.js';

vi.mock('../services/reviewCommentService.js', () => ({
    ReviewCommentService: vi.fn(function() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const instance: any = this;
        instance.createComment = vi.fn().mockResolvedValue({ created: 'OK', threadId: 'test-thread-id' });
        instance.readComments = vi.fn().mockResolvedValue([]);
        instance.deleteComments = vi.fn().mockResolvedValue({ deleted: 'OK' });
        return instance;
    })
}));

describe('ReviewCommentController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let statusMock: any;
    let sendMock: any;

    beforeEach(() => {
        statusMock = vi.fn().mockReturnThis();
        sendMock = vi.fn();
        mockResponse = {
            status: statusMock,
            send: sendMock
        };
    });

    describe('createComment', () => {
        it('should create a comment successfully', async () => {
            mockRequest = {
                body: {
                    request: {
                        contextDetails: {
                            contentId: 'test-content',
                            contentVer: '1.0',
                            contentType: 'Resource'
                        },
                        body: 'Test comment',
                        userId: 'user-123',
                        userInfo: { name: 'Test User' }
                    }
                }
            };

            await createComment(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalled();
        });
    });

    describe('readComments', () => {
        it('should read comments successfully', async () => {
            mockRequest = {
                body: {
                    request: {
                        contextDetails: {
                            contentId: 'test-content',
                            contentVer: '1.0',
                            contentType: 'Resource'
                        }
                    }
                }
            };

            await readComments(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalled();
        });
    });

    describe('deleteComments', () => {
        it('should delete comments successfully', async () => {
            mockRequest = {
                body: {
                    request: {
                        contextDetails: {
                            contentId: 'test-content',
                            contentVer: '1.0',
                            contentType: 'Resource'
                        }
                    }
                }
            };

            await deleteComments(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalled();
        });
    });
});
