/**
 * get_pull_request - Get a single pull/merge request
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	pr_number: z.number().int().positive().describe('Pull request number'),
});

export const getPullRequest = defineTool({
	name: 'get_pull_request',
	description: 'Get details of a pull request (merge request in GitLab)',
	schema,
	category: 'pull-requests',
	read_only: true,
	handler: async (input, ctx) => {
		return ctx.provider.pullRequests.get(input.repo, input.pr_number);
	},
});
