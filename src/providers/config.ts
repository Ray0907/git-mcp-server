/**
 * Provider Configuration - Platform-agnostic configuration types
 */

import { z } from 'zod';

// ============================================================================
// Provider Type
// ============================================================================

export const ProviderTypeSchema = z.enum(['gitlab', 'github']);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

// ============================================================================
// Provider Configuration Schema
// ============================================================================

export const ProviderConfigSchema = z.object({
	/** Git provider type */
	provider: ProviderTypeSchema.default('gitlab'),

	/** API base URL */
	api_url: z.string().url(),

	/** Authentication token */
	token: z.string().optional(),

	/** Auth type (provider-specific interpretation) */
	auth_type: z.enum(['bearer', 'private-token', 'token']).default('bearer'),

	/** Use OAuth flow */
	use_oauth: z.boolean().default(false),

	/** OAuth client ID */
	oauth_client_id: z.string().optional(),

	/** OAuth token storage path */
	oauth_token_path: z.string().optional(),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get default API URL for a provider
 */
export function getDefaultApiUrl(provider: ProviderType): string {
	switch (provider) {
		case 'gitlab':
			return 'https://gitlab.com/api/v4';
		case 'github':
			return 'https://api.github.com';
		default: {
			const exhaustive: never = provider;
			throw new Error(`Unknown provider: ${exhaustive}`);
		}
	}
}
