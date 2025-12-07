/**
 * MCP Server - Handles protocol and transport
 *
 * This server is completely decoupled from specific Git providers.
 * It uses the Provider Factory to create the appropriate provider.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';

import type { Config } from './config.js';
import type { Logger } from './lib/logger.js';
import type { AuthProvider } from './auth/types.js';
import type { GitProvider } from './providers/interface.js';
import { createProvider } from './providers/factory.js';
import { ToolRegistry } from './tools/registry.js';
import type { ToolContext, AnyToolDefinition } from './tools/types.js';

// ============================================================================
// Server Options
// ============================================================================

export interface ServerOptions {
	name: string;
	version: string;
	config: Config;
	logger: Logger;
	auth: AuthProvider;
	tools: AnyToolDefinition[];
}

// ============================================================================
// Server Class
// ============================================================================

export class McpServer {
	private readonly server: Server;
	private readonly registry: ToolRegistry;
	private readonly provider: GitProvider;
	private readonly logger: Logger;
	private readonly config: Config;

	constructor(options: ServerOptions) {
		this.config = options.config;
		this.logger = options.logger;

		// Create MCP server
		this.server = new Server(
			{ name: options.name, version: options.version },
			{ capabilities: { tools: {} } }
		);

		// Create provider using factory (decoupled from specific implementations)
		this.provider = createProvider({
			config: options.config.provider,
			auth: options.auth,
			logger: options.logger,
		});

		this.logger.info(`Provider created: ${this.provider.info.type}`, {
			provider: this.provider.info.type,
			api_url: this.provider.info.base_url,
		});

		// Create tool registry
		this.registry = new ToolRegistry({
			read_only: options.config.read_only,
			tool_filter: options.config.tool_filter,
			logger: options.logger,
		});

		// Register tools
		this.registry.registerAll(options.tools);

		// Setup handlers
		this.setupHandlers();
	}

	// ========================================================================
	// MCP Handlers
	// ========================================================================

	private setupHandlers(): void {
		// List tools
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			return { tools: this.registry.listTools() };
		});

		// Call tool
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const request_id = randomUUID();
			const tool_name = request.params.name;
			const input = request.params.arguments ?? {};

			this.logger.info(`Executing tool: ${tool_name}`, { request_id });

			// Create context
			const ctx: ToolContext = {
				provider: this.provider,
				logger: this.logger.child({ request_id, tool: tool_name }),
				request_id,
			};

			// Execute
			const result = await this.registry.execute(tool_name, input, ctx);

			this.logger.info(`Tool completed: ${tool_name}`, {
				request_id,
				success: result.success,
			});

			return this.registry.formatResponse(result);
		});
	}

	// ========================================================================
	// Transport
	// ========================================================================

	async start(): Promise<void> {
		this.logger.info('Starting MCP server', {
			transport: this.config.transport,
			provider: this.provider.info.type,
			tools: this.registry.size,
		});

		switch (this.config.transport) {
			case 'stdio':
				await this.startStdio();
				break;
			case 'sse':
			case 'http':
				throw new Error(`Transport "${this.config.transport}" not yet implemented`);
			default:
				throw new Error(`Unknown transport: ${this.config.transport}`);
		}
	}

	private async startStdio(): Promise<void> {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		this.logger.info('Server running on stdio');
	}

	async stop(): Promise<void> {
		await this.server.close();
		this.logger.info('Server stopped');
	}
}

// ============================================================================
// Factory
// ============================================================================

export function createMcpServer(options: ServerOptions): McpServer {
	return new McpServer(options);
}
