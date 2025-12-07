/**
 * update_issue - Update an existing issue
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	issue_number: z.number().int().positive().describe('Issue number'),
	title: z.string().min(1).optional().describe('New title'),
	description: z.string().optional().describe('New description'),
	labels: z.array(z.string()).optional().describe('Labels (replaces existing)'),
	assignee_ids: z.array(z.number()).optional().describe('User IDs to assign'),
	state: z.enum(['open', 'closed']).optional().describe('Change issue state'),
});

export const updateIssue = defineTool({
	name: 'update_issue',
	description: 'Update an existing issue in a project',
	schema,
	category: 'issues',
	read_only: false,
	handler: async (input, ctx) => {
		const { repo, issue_number, ...params } = input;
		return ctx.provider.issues.update(repo, issue_number, params);
	},
});
