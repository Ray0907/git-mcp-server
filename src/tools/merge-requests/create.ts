/**
 * create_pull_request - Create a new pull/merge request
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	source_branch: z.string().describe('Source branch name'),
	target_branch: z.string().describe('Target branch name'),
	title: z.string().min(1).describe('Pull request title'),
	description: z.string().optional().describe('Description (Markdown)'),
	assignee_ids: z.array(z.number()).optional().describe('User IDs to assign'),
	reviewer_ids: z.array(z.number()).optional().describe('User IDs for review'),
	labels: z.array(z.string()).optional().describe('Labels to apply'),
	draft: z.boolean().optional().describe('Create as draft'),
});

export const createPullRequest = defineTool({
	name: 'create_pull_request',
	description: 'Create a new pull request (merge request in GitLab)',
	schema,
	category: 'pull-requests',
	read_only: false,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.pullRequests.create(repo, params);
	},
});
