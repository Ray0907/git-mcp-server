/**
 * Tool Types - Core type definitions for tools
 */

import type { z } from 'zod';
import type { GitProvider } from '../providers/interface.js';
import type { Logger } from '../lib/logger.js';

// ============================================================================
// Tool Context
// ============================================================================

/**
 * Context passed to every tool handler
 */
export interface ToolContext {
	/** Git provider instance (GitLab, GitHub, etc.) */
	provider: GitProvider;
	/** Logger instance */
	logger: Logger;
	/** Unique request ID */
	request_id: string;
}

// ============================================================================
// Tool Definition
// ============================================================================

/**
 * Tool handler function
 */
export type ToolHandler<TInput, TOutput> = (
	input: TInput,
	ctx: ToolContext
) => Promise<TOutput>;

/**
 * Complete tool definition
 */
export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
	/** Tool name (snake_case) */
	name: string;
	/** Description for AI model */
	description: string;
	/** Zod schema for input validation */
	schema: z.ZodSchema<TInput>;
	/** Handler function */
	handler: ToolHandler<TInput, TOutput>;
	/** Category for organization */
	category?: string;
	/** Read-only tool (no side effects) */
	read_only?: boolean;
	/** Tags for filtering */
	tags?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDefinition = ToolDefinition<any, any>;

// ============================================================================
// Tool Result
// ============================================================================

/**
 * Standardized tool execution result
 */
export interface ToolResult<T = unknown> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
}
