/**
 * Content Editor Proxy Routes
 *
 * Wires the contentProxyUrl proxy middlewares to their Express routes.
 * Ported from SunbirdEd-portal contentEditorProxy.js (contentProxyUrl routes only).
 *
 * Route order matters: specific routes are registered before the /action/* catch-all.
 */

import express from 'express';
import {
    // contentUploadProxy,
    contentActionProxy,
} from '../proxies/knowlgMwProxy.js';

const router = express.Router();

// ─── Action catch-all ─────────────────────────────────────────────────────────
// Handles all remaining /action/* routes (content CRUD, read, hierarchy, etc.)
router.all('/portal/lock/*rest', express.json({ limit: '50mb' }), contentActionProxy)
router.all('/action/*rest', express.json({ limit: '50mb' }), contentActionProxy);

export default router;
