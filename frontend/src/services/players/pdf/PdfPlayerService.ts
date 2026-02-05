import { ContentPlayerService } from './ContentPlayerService';

/**
 * Service for initializing and managing the PDF Player.
 * Extends ContentPlayerService to reuse core functionality and avoid duplication.
 */
export class PdfPlayerService extends ContentPlayerService {
  // All functionality is inherited from ContentPlayerService
  // This class serves as a specific entry point for PDF player needs if they diverge in future
}