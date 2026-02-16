import { Request, Response } from 'express';
import { searchContent } from '../services/contentService.js';
import logger from '../utils/logger.js';

export const search = async (req: Request, res: Response) => {
  try {
    const filters = req.body.request?.filters || {};
    const limit = req.body.request?.limit || 100;
    const offset = req.body.request?.offset || 0;
    const query = req.body.request?.query || "";
    const sort_by = req.body.request?.sort_by;
    const result = await searchContent(filters, limit, offset, query, sort_by);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Content search failed', error);
    res.status(500).json({
      id: "api.content.search",
      ver: "1.0",
      ts: new Date().toISOString(),
      params: {
        resmsgid: "",
        msgid: "",
        status: "failed",
        err: "INTERNAL_SERVER_ERROR",
        errmsg: "Failed to search content"
      },
      responseCode: "INTERNAL_SERVER_ERROR",
      result: {}
    });
  }
};
