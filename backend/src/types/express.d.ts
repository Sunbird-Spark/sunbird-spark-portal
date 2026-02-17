/* eslint-disable no-unused-vars */
import 'express';
import { Grant } from 'keycloak-connect';

declare module 'express' {
    interface Request {
        kauth?: {
            grant?: Grant;
        };
    }
}