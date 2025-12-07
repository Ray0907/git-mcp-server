/**
 * list_commits - List repository commits
 *
 * View commit history for a repository
 */

import { z } from 'zod';
import { defineTool, repoParam, withPagination } from '../define.js';

const schema = withPagination(z.object({
	repo: repoParam,
	ref: z.string().optional().describe('Branch name or commit SHA to list commits from'),
	path: z.string().optional().describe('File path to filter commits'),
	since: z.string().optional().describe('Only commits after this date (ISO 8601 format)'),
	until: z.string().optional().describe('Only commits before this date (ISO 8601 format)'),
	author: z.string().optional().describe('Filter by author email or name'),
	with_stats: z.boolean().optional().describe('Include commit stats (additions, deletions)'),
}));

export const listCommits = defineTool({
	name: 'list_commits',
	description: 'List commits in a repository. Filter by branch, path, date range, or author.',
	schema,
	category: 'repository',
	read_only: true,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.repository.listCommits(repo, params);
	},
});
