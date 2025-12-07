/**
 * create_comment - Add a comment to an issue or pull request
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	type: z.enum(['issue', 'pull_request']).describe('Type of item to comment on'),
	number: z.number().int().positive().describe('Issue or PR number'),
	body: z.string().min(1).describe('Comment content (Markdown supported)'),
});

export const createComment = defineTool({
	name: 'create_comment',
	description: 'Add a comment to an issue or pull request',
	schema,
	category: 'comments',
	read_only: false,
	handler: async (input, ctx) => {
		if (input.type === 'issue') {
			return ctx.provider.issues.createComment(input.repo, input.number, { body: input.body });
		} else {
			return ctx.provider.pullRequests.createComment(input.repo, input.number, { body: input.body });
		}
	},
});
