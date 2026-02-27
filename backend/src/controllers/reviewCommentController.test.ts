import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { createComment, readComments, deleteComments } from './reviewCommentController.js';

vi.mock('../services/reviewCommentService.js', () => ({
    ReviewCommentService: vi.fn(function() {
        // @ts-expect-error - Mock constructor pattern
        this.createComment = vi.fn().mockResolvedValue({ created: 'OK', threadId: 'test-thread-id' });
        // @ts-expect-error - Mock constructor pattern
        this.readComments = vi.fn().mockResolvedValue([]);
        // @ts-expect-error - Mock constructor pattern
        this.deleteComments = vi.fn().mockResolvedValue({ deleted: 'OK' });
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
