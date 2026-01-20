import type { Request } from 'express';

export const saveSession = (req: Request): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }
        req.session.save((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

export const regenerateSession = (req: Request): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }
        req.session.regenerate((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

export const destroySession = (req: Request): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }
        req.session.destroy((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};