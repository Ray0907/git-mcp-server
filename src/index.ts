#!/usr/bin/env node
/**
 * Git MCP Server - Entry Point
 */

import { loadConfig, validateConfig } from './config.js';
import { createLogger } from './lib/logger.js';
import { createAuthFromEnv } from './auth/index.js';
import { createMcpServer } from './server.js';
import { allTools } from './tools/index.js';

const VERSION = '0.1.0';

async function main() {
	// Load configuration
	const config = loadConfig();
	validateConfig(config);

	// Create logger
	const logger = createLogger({ level: config.log_level });

	logger.info('Git MCP Server starting', { version: VERSION });

	// Create auth provider
	const auth = createAuthFromEnv();
	logger.info('Auth configured');

	// Create and start server
	const server = createMcpServer({
		name: 'git-mcp-server',
		version: VERSION,
		config,
		logger,
		auth,
		tools: allTools,
	});

	// Handle shutdown
	const shutdown = async () => {
		logger.info('Shutting down...');
		await server.stop();
		process.exit(0);
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);

	// Start
	await server.start();
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
