/**
 * Anonymous Action Routes
 *
 * Handles action-path endpoints that do NOT require authentication.
 * These routes run with full anonymous session middleware (Kong anonymous token
 * + default org resolution) so that telemetry events emitted by guest/anonymous
 * users are correctly attributed and forwarded to Kong.
 *
 * Why a separate file?
 * ────────────────────
 * The main `/action/*` catch-all in `knowlgMwProxyRoutes` runs under `oidcSession()`,
 * which is only meaningful for authenticated users. Registering anonymous-safe action
 * routes BEFORE that catch-all ensures unauthenticated SDK batch flushes reach Kong
 * without being blocked by missing OIDC tokens.
 *
 * Route: POST /action/data/v3/telemetry
 * ─────────────────────────────────────
 * The Sunbird Telemetry JS SDK (initialized in TelemetryProvider) flushes batched
 * events to this path. The SDK sets uid="anonymous" and uses the device ID as the
 * actor for guest sessions — the payload is already correctly attributed.
 * This route simply proxies the payload to Kong, identical to how system/settings
 * and org/search are treated for anonymous users.
 */

import express, { Request, Response, NextFunction } from 'express';
import { kongProxy } from '../proxies/kongProxy.js';

const router = express.Router();

// Telemetry sync endpoint — open to anonymous users.
// The SDK sends batched events here; Kong receives and stores them server-side.
//
// Note: the 10mb body limit for this path is applied globally in app.ts, before
// the global express.json() parser, so large SDK batches are parsed correctly.
router.post(
  '/data/v3/telemetry',
  (req: Request, res: Response, next: NextFunction) => {
    // Guard against empty bodies or payloads missing the events array.
    // Kong would return a cryptic error; we surface a clear 400 here instead.
    if (!req.body || !Array.isArray(req.body.events)) {
      res.status(400).json({ message: 'Invalid telemetry payload: events array required' });
      return;
    }
    next();
  },
  kongProxy,
);

export default router;
