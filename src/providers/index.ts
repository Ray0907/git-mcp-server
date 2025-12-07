/**
 * Providers - Platform-agnostic Git operations
 */

// Types
export type * from './types.js';
export type * from './interface.js';

// Config types (explicit to avoid conflicts with types.ts ProviderType)
export type { ProviderConfig } from './config.js';
export { ProviderTypeSchema, ProviderConfigSchema } from './config.js';

// Factory
export { createProvider } from './factory.js';
export { getDefaultApiUrl } from './config.js';
