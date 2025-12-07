/**
 * list_comments - List comments on an issue or pull request
 */

import { z } from 'zod';
import { defineTool, repoParam, withPagination } from '../define.js';

const schema = withPagination(
	z.object({
		repo: repoParam,
		type: z.enum(['issue', 'pull_request']).describe('Type of item'),
		number: z.number().int().positive().describe('Issue or PR number'),
		sort: z.enum(['asc', 'desc']).optional().describe('Sort order'),
	})
);

export const listComments = defineTool({
	name: 'list_comments',
	description: 'List all comments on an issue or pull request',
	schema,
	category: 'comments',
	read_only: true,
	handler: async (input, ctx) => {
		const { repo, type, number, ...params } = input;
		if (type === 'issue') {
			return ctx.provider.issues.listComments(repo, number, params);
		} else {
			return ctx.provider.pullRequests.listComments(repo, number, params);
		}
	},
});
