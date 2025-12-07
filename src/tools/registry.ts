/**
 * Tool Registry - Manages all registered tools
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ToolDefinition, ToolContext, ToolResult } from './types.js';
import type { Logger } from '../lib/logger.js';
import { ValidationError, formatError } from '../lib/errors.js';

// ============================================================================
// Registry Options
// ============================================================================

export interface RegistryOptions {
	/** Only allow read-only tools */
	read_only?: boolean;
	/** Regex pattern to filter tools by name */
	tool_filter?: string;
	/** Logger instance */
	logger: Logger;
}

// ============================================================================
// Registry Implementation
// ============================================================================

export class ToolRegistry {
	private tools = new Map<string, ToolDefinition>();
	private readonly options: RegistryOptions;
	private readonly filter_regex?: RegExp;

	constructor(options: RegistryOptions) {
		this.options = options;
		if (options.tool_filter) {
			this.filter_regex = new RegExp(options.tool_filter);
		}
	}

	// ========================================================================
	// Registration
	// ========================================================================

	/**
	 * Register a single tool
	 */
	register(tool: ToolDefinition): this {
		// Check read-only filter
		if (this.options.read_only && !tool.read_only) {
			this.options.logger.debug(`Skipping non-read-only tool: ${tool.name}`);
			return this;
		}

		// Check name filter
		if (this.filter_regex && !this.filter_regex.test(tool.name)) {
			this.options.logger.debug(`Skipping filtered tool: ${tool.name}`);
			return this;
		}

		// Check duplicate
		if (this.tools.has(tool.name)) {
			throw new Error(`Tool "${tool.name}" is already registered`);
		}

		this.tools.set(tool.name, tool);
		this.options.logger.info(`Registered tool: ${tool.name}`, {
			category: tool.category,
			read_only: tool.read_only,
		});

		return this;
	}

	/**
	 * Register multiple tools
	 */
	registerAll(tools: ToolDefinition[]): this {
		for (const tool of tools) {
			this.register(tool);
		}
		return this;
	}

	// ========================================================================
	// Execution
	// ========================================================================

	/**
	 * Execute a tool by name
	 */
	async execute(name: string, input: unknown, ctx: ToolContext): Promise<ToolResult> {
		const tool = this.tools.get(name);

		if (!tool) {
			return {
				success: false,
				error: {
					code: 'TOOL_NOT_FOUND',
					message: `Tool "${name}" not found`,
				},
			};
		}

		// Validate input
		const validation = tool.schema.safeParse(input);
		if (!validation.success) {
			return {
				success: false,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Invalid input',
					details: validation.error.errors,
				},
			};
		}

		// Execute handler
		try {
			const data = await tool.handler(validation.data, ctx);
			return { success: true, data };
		} catch (err) {
			return {
				success: false,
				error: formatError(err),
			};
		}
	}

	// ========================================================================
	// MCP Protocol
	// ========================================================================

	/**
	 * Get tool list for MCP ListToolsRequest
	 */
	listTools(): Array<{
		name: string;
		description: string;
		inputSchema: Record<string, unknown>;
	}> {
		return Array.from(this.tools.values()).map((tool) => ({
			name: tool.name,
			description: tool.description,
			inputSchema: this.toJsonSchema(tool.schema),
		}));
	}

	/**
	 * Format result for MCP CallToolResponse
	 */
	formatResponse(result: ToolResult): {
		content: Array<{ type: 'text'; text: string }>;
		isError?: boolean;
	} {
		if (result.success) {
			return {
				content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
			};
		}

		return {
			content: [{ type: 'text', text: JSON.stringify(result.error, null, 2) }],
			isError: true,
		};
	}

	// ========================================================================
	// Queries
	// ========================================================================

	/**
	 * Check if tool exists
	 */
	has(name: string): boolean {
		return this.tools.has(name);
	}

	/**
	 * Get tool by name
	 */
	get(name: string): ToolDefinition | undefined {
		return this.tools.get(name);
	}

	/**
	 * Get all tool names
	 */
	getNames(): string[] {
		return Array.from(this.tools.keys());
	}

	/**
	 * Get tools by category
	 */
	getByCategory(category: string): ToolDefinition[] {
		return Array.from(this.tools.values()).filter((t) => t.category === category);
	}

	/**
	 * Get tool count
	 */
	get size(): number {
		return this.tools.size;
	}

	// ========================================================================
	// Helpers
	// ========================================================================

	private toJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
		const json = zodToJsonSchema(schema, { $refStrategy: 'none' });
		// Remove $schema for compatibility
		if (typeof json === 'object' && json !== null) {
			delete (json as Record<string, unknown>)['$schema'];
		}
		return json as Record<string, unknown>;
	}
}

// ============================================================================
// Factory
// ============================================================================

export function createRegistry(options: RegistryOptions): ToolRegistry {
	return new ToolRegistry(options);
}
