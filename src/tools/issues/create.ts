/**
 * create_issue - Create a new issue in a project
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	title: z.string().min(1).describe('Issue title'),
	description: z.string().optional().describe('Issue description (Markdown supported)'),
	labels: z.array(z.string()).optional().describe('Labels to apply'),
	assignee_ids: z.array(z.number()).optional().describe('Array of user IDs to assign'),
});

export const createIssue = defineTool({
	name: 'create_issue',
	description: 'Create a new issue in a project',
	schema,
	category: 'issues',
	read_only: false,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.issues.create(repo, params);
	},
});
