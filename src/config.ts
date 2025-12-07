/**
 * Configuration - Single source of truth for all settings
 */

import { z } from 'zod';
import {
	ProviderTypeSchema,
	ProviderConfigSchema,
	getDefaultApiUrl,
	type ProviderConfig,
	type ProviderType,
} from './providers/config.js';

// ============================================================================
// Schema
// ============================================================================

const ConfigSchema = z.object({
	// Provider (abstracted)
	provider: ProviderConfigSchema,

	// Server
	read_only: z.boolean().default(false),
	tool_filter: z.string().optional(),
	log_level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

	// Transport
	transport: z.enum(['stdio', 'sse', 'http']).default('stdio'),
	host: z.string().default('0.0.0.0'),
	port: z.number().int().min(1).max(65535).default(3000),
});

export type Config = z.infer<typeof ConfigSchema>;

// ============================================================================
// Load from Environment
// ============================================================================

export function loadConfig(): Config {
	// Determine provider type
	const provider_type = resolveProviderType();

	// Resolve API URL
	const api_url = process.env.GIT_API_URL || getDefaultApiUrl(provider_type);

	// Build provider config
	const provider_config: ProviderConfig = {
		provider: provider_type,
		api_url,
		token: process.env.GIT_TOKEN,
		auth_type: (process.env.GIT_AUTH_TYPE || 'bearer') as ProviderConfig['auth_type'],
		use_oauth: process.env.GIT_USE_OAUTH === 'true',
		oauth_client_id: process.env.GIT_OAUTH_CLIENT_ID,
		oauth_token_path: process.env.GIT_OAUTH_TOKEN_PATH,
	};

	const raw = {
		provider: provider_config,
		read_only: process.env.GIT_READ_ONLY === 'true',
		tool_filter: process.env.GIT_TOOL_FILTER,
		log_level: process.env.LOG_LEVEL,
		transport: process.env.MCP_TRANSPORT,
		host: process.env.MCP_HOST,
		port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : undefined,
	};

	const result = ConfigSchema.safeParse(raw);

	if (!result.success) {
		const errors = result.error.errors
			.map((e) => `  - ${e.path.join('.')}: ${e.message}`)
			.join('\n');
		throw new Error(`Configuration error:\n${errors}`);
	}

	return result.data;
}

// ============================================================================
// Resolution Helpers
// ============================================================================

function resolveProviderType(): ProviderType {
	if (process.env.GIT_PROVIDER) {
		const result = ProviderTypeSchema.safeParse(process.env.GIT_PROVIDER.toLowerCase());
		if (result.success) return result.data;
		throw new Error(`Invalid GIT_PROVIDER: ${process.env.GIT_PROVIDER}. Must be 'gitlab' or 'github'.`);
	}

	// Default to GitLab
	return 'gitlab';
}

// ============================================================================
// Validate at Startup
// ============================================================================

export function validateConfig(config: Config): void {
	const { provider } = config;

	// Validate API URL
	try {
		new URL(provider.api_url);
	} catch {
		throw new Error(`Invalid GIT_API_URL: ${provider.api_url}`);
	}

	// Validate auth configuration
	const has_token = !!provider.token;
	const has_oauth = provider.use_oauth;

	if (!has_token && !has_oauth) {
		throw new Error(
			`No auth configured. Set one of:\n` +
			`  - GIT_TOKEN\n` +
			`  - GIT_USE_OAUTH=true with GIT_OAUTH_CLIENT_ID`
		);
	}

	// Validate OAuth config
	if (has_oauth && !provider.oauth_client_id) {
		throw new Error('GIT_OAUTH_CLIENT_ID is required when GIT_USE_OAUTH=true');
	}
}
