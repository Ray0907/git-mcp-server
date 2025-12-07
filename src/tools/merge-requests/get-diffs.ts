/**
 * get_pull_request_diffs - Get the changes/diffs of a pull request
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	pr_number: z.number().int().positive().describe('Pull request number'),
});

export const getPullRequestDiffs = defineTool({
	name: 'get_pull_request_diffs',
	description: 'Get the changes/diffs of a pull request to see what files were modified',
	schema,
	category: 'pull-requests',
	read_only: true,
	handler: async (input, ctx) => {
		return ctx.provider.pullRequests.getDiffs(input.repo, input.pr_number);
	},
});
