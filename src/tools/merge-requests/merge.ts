/**
 * merge_pull_request - Merge a pull/merge request
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	pr_number: z.number().int().positive().describe('Pull request number'),
	commit_message: z.string().optional().describe('Custom merge commit message'),
	squash: z.boolean().optional().describe('Squash commits'),
	delete_branch: z.boolean().optional().describe('Delete source branch after merge'),
});

export const mergePullRequest = defineTool({
	name: 'merge_pull_request',
	description: 'Merge a pull request (merge request in GitLab)',
	schema,
	category: 'pull-requests',
	read_only: false,
	handler: async (input, ctx) => {
		const { repo, pr_number, ...params } = input;
		return ctx.provider.pullRequests.merge(repo, pr_number, params);
	},
});
