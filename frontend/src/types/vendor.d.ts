// Ambient declarations for JS-only packages that ship no TypeScript types
// and have no @types/* package on npm.
// The actual shape is supplied by the JsigsModule / SecurityContextModule
// interfaces in CertificateVerificationService.ts via `as` casts.
declare module 'jsonld-signatures';
declare module 'security-context';
