import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewCommentService } from './reviewCommentService.js';

vi.mock('../databases/reviewCommentDatabase.js', () => ({
    getReviewCommentClient: vi.fn(() => ({
        execute: vi.fn()
    }))
}));

describe('ReviewCommentService', () => {
    let service: ReviewCommentService;

    beforeEach(() => {
        service = new ReviewCommentService();
    });

    it('should be instantiated', () => {
        expect(service).toBeDefined();
    });

    it('should have createComment method', () => {
        expect(service.createComment).toBeDefined();
    });

    it('should have readComments method', () => {
        expect(service.readComments).toBeDefined();
    });

    it('should have deleteComments method', () => {
        expect(service.deleteComments).toBeDefined();
    });
});
