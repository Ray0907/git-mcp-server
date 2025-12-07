/**
 * list_pull_requests - List pull/merge requests in a project
 */

import { z } from 'zod';
import { defineTool, repoParam, withPagination } from '../define.js';

const schema = withPagination(
	z.object({
		repo: repoParam,
		state: z.enum(['open', 'closed', 'merged', 'all']).optional().describe('Filter by state'),
		source_branch: z.string().optional().describe('Filter by source branch'),
		target_branch: z.string().optional().describe('Filter by target branch'),
		labels: z.array(z.string()).optional().describe('Filter by labels'),
		search: z.string().optional().describe('Search in title and description'),
		sort: z.enum(['created', 'updated']).optional().describe('Sort field'),
		direction: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
	})
);

export const listPullRequests = defineTool({
	name: 'list_pull_requests',
	description: 'List pull requests (merge requests in GitLab) with optional filters',
	schema,
	category: 'pull-requests',
	read_only: true,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.pullRequests.list(repo, params);
	},
});
