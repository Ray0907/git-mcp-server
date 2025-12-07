/**
 * Auth Module - Factory for creating auth providers
 */

export type { AuthProvider, AuthConfig, PatAuthConfig, OAuthConfig, CookieAuthConfig } from './types.js';
export { PatAuthProvider, createPatAuth } from './pat.js';
export { OAuthProvider, createOAuth } from './oauth.js';
export { CookieAuthProvider, createCookieAuth } from './cookie.js';

import type { AuthProvider, AuthConfig } from './types.js';
import { createPatAuth } from './pat.js';
import { createOAuth } from './oauth.js';
import { createCookieAuth } from './cookie.js';

/**
 * Create auth provider from config
 */
export function createAuth(config: AuthConfig): AuthProvider {
	switch (config.type) {
		case 'pat':
			return createPatAuth(config);
		case 'oauth':
			return createOAuth(config);
		case 'cookie':
			return createCookieAuth(config);
		default:
			throw new Error(`Unknown auth type: ${(config as AuthConfig).type}`);
	}
}

/**
 * Create auth provider from environment variables
 */
export function createAuthFromEnv(): AuthProvider {
	// Check OAuth first
	if (process.env.GITLAB_USE_OAUTH === 'true') {
		const client_id = process.env.GITLAB_OAUTH_CLIENT_ID;
		if (!client_id) {
			throw new Error('GITLAB_OAUTH_CLIENT_ID is required when GITLAB_USE_OAUTH=true');
		}
		return createOAuth({
			type: 'oauth',
			client_id,
			gitlab_url: (process.env.GITLAB_API_URL ?? 'https://gitlab.com/api/v4').replace('/api/v4', ''),
			token_path: process.env.GITLAB_OAUTH_TOKEN_PATH,
		});
	}

	// Check Cookie
	if (process.env.GITLAB_AUTH_COOKIE_PATH) {
		return createCookieAuth({
			type: 'cookie',
			cookie_path: process.env.GITLAB_AUTH_COOKIE_PATH,
		});
	}

	// Default to PAT
	const token = process.env.GITLAB_TOKEN ?? process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
	if (!token) {
		throw new Error('No auth configured. Set GITLAB_TOKEN, GITLAB_USE_OAUTH=true, or GITLAB_AUTH_COOKIE_PATH');
	}

	return createPatAuth({
		type: 'pat',
		token,
		use_private_token: process.env.GITLAB_AUTH_TYPE === 'private-token',
	});
}
