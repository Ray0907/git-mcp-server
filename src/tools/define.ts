/**
 * Tool Definition Helper - Simple, type-safe tool creation
 */

import { z } from 'zod';
import type { ToolDefinition, ToolHandler, ToolContext } from './types.js';

// ============================================================================
// defineTool - The main API for creating tools
// ============================================================================

/**
 * Define a new tool with full type inference
 *
 * @example
 * ```ts
 * const getIssue = defineTool({
 *     name: 'get_issue',
 *     description: 'Get a single issue from a GitLab project',
 *     schema: z.object({
 *         project_id: z.string(),
 *         issue_iid: z.number(),
 *     }),
 *     category: 'issues',
 *     read_only: true,
 *     handler: async (input, ctx) => {
 *         const project = ctx.gitlab.encodeProject(input.project_id);
 *         return ctx.gitlab.get(`/projects/${project}/issues/${input.issue_iid}`);
 *     },
 * });
 * ```
 */
export function defineTool<TInput, TOutput>(
	definition: ToolDefinition<TInput, TOutput>
): ToolDefinition<TInput, TOutput> {
	// Validate name format
	if (!/^[a-z][a-z0-9_]*$/.test(definition.name)) {
		throw new Error(
			`Invalid tool name "${definition.name}". Use snake_case starting with a letter.`
		);
	}

	return definition;
}

// ============================================================================
// Common Schema Patterns
// ============================================================================

/**
 * Repository parameter - works with both GitLab and GitHub
 *
 * GitLab: project ID (number) or path (e.g., "group/project")
 * GitHub: owner/repo (e.g., "octocat/hello-world")
 */
export const repoParam = z
	.string()
	.describe('Repository identifier (GitLab: "group/project" or ID, GitHub: "owner/repo")');

/**
 * @deprecated Use repoParam instead
 */
export const projectIdParam = repoParam;

/**
 * Pagination parameters
 */
export const paginationParams = z.object({
	page: z.number().int().positive().optional().describe('Page number (default: 1)'),
	per_page: z.number().int().min(1).max(100).optional().describe('Items per page (default: 20, max: 100)'),
});

/**
 * Create pagination params merged with other schema
 */
export function withPagination<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
	return schema.merge(paginationParams);
}
