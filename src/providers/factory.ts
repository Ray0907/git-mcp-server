/**
 * Provider Factory - Creates the appropriate Git provider based on configuration
 *
 * This factory pattern allows the server to be completely decoupled from
 * specific Git platform implementations.
 */

import type { GitProvider } from './interface.js';
import type { ProviderConfig } from './config.js';
import type { AuthProvider } from '../auth/types.js';
import type { Logger } from '../lib/logger.js';

import { GitLabClient } from '../gitlab/client.js';
import { createGitLabProvider } from './gitlab/index.js';

// ============================================================================
// Factory Types
// ============================================================================

export interface ProviderFactoryOptions {
	config: ProviderConfig;
	auth: AuthProvider;
	logger: Logger;
}

// ============================================================================
// Factory Implementation
// ============================================================================

/**
 * Create a Git provider based on configuration
 *
 * This is the single point where platform-specific code is instantiated.
 * All other parts of the system only know about the GitProvider interface.
 */
export function createProvider(options: ProviderFactoryOptions): GitProvider {
	const { config, auth, logger } = options;

	switch (config.provider) {
		case 'gitlab': {
			const client = new GitLabClient({
				base_url: config.api_url,
				auth,
				logger,
			});
			return createGitLabProvider(client, config.api_url);
		}

		case 'github': {
			// TODO: Implement GitHub provider
			throw new Error(
				'GitHub provider not yet implemented. ' +
				'Contributions welcome at https://github.com/anthropics/git-mcp-server'
			);
		}

		default: {
			const exhaustive: never = config.provider;
			throw new Error(`Unknown provider: ${exhaustive}`);
		}
	}
}
