/**
 * search_code - Search for code in a repository
 *
 * Find code matching a search query
 */

import { z } from 'zod';
import { defineTool, repoParam, withPagination } from '../define.js';

const schema = withPagination(z.object({
	repo: repoParam,
	query: z.string().describe('Search query to find in code'),
	ref: z.string().optional().describe('Branch or commit to search in'),
}));

export const searchCode = defineTool({
	name: 'search_code',
	description: 'Search for code in a repository. Returns matching files and lines.',
	schema,
	category: 'repository',
	read_only: true,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.repository.searchCode(repo, params);
	},
});
