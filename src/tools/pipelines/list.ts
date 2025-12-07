/**
 * list_pipelines - List CI/CD pipelines in a project
 */

import { z } from 'zod';
import { defineTool, repoParam, withPagination } from '../define.js';

const schema = withPagination(
	z.object({
		repo: repoParam,
		status: z
			.enum(['pending', 'running', 'success', 'failed', 'canceled', 'skipped'])
			.optional()
			.describe('Filter by status'),
		ref: z.string().optional().describe('Filter by branch or tag name'),
		sha: z.string().optional().describe('Filter by commit SHA'),
		sort: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
	})
);

export const listPipelines = defineTool({
	name: 'list_pipelines',
	description: 'List CI/CD pipelines (workflow runs in GitHub) with optional filters',
	schema,
	category: 'ci',
	read_only: true,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.ci.listPipelines(repo, params);
	},
});
