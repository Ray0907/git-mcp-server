/**
 * list_issues - List issues in a project
 */

import { z } from 'zod';
import { defineTool, repoParam, withPagination } from '../define.js';

const schema = withPagination(
	z.object({
		repo: repoParam,
		state: z.enum(['open', 'closed', 'all']).optional().describe('Filter by state'),
		labels: z.array(z.string()).optional().describe('Filter by labels'),
		search: z.string().optional().describe('Search in title and description'),
		assignee_id: z.number().optional().describe('Filter by assignee ID'),
		author_id: z.number().optional().describe('Filter by author ID'),
		sort: z.enum(['created', 'updated']).optional().describe('Sort field'),
		direction: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
	})
);

export const listIssues = defineTool({
	name: 'list_issues',
	description: 'List issues in a project with optional filters',
	schema,
	category: 'issues',
	read_only: true,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.issues.list(repo, params);
	},
});
