/**
 * list_branches - List repository branches
 *
 * View all branches in a repository
 */

import { z } from 'zod';
import { defineTool, repoParam, withPagination } from '../define.js';

const schema = withPagination(z.object({
	repo: repoParam,
	search: z.string().optional().describe('Search term to filter branches'),
}));

export const listBranches = defineTool({
	name: 'list_branches',
	description: 'List branches in a repository. Optionally search for specific branches.',
	schema,
	category: 'repository',
	read_only: true,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.repository.listBranches(repo, params);
	},
});
