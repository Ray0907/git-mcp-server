/**
 * get_issue - Get a single issue from a project
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	issue_number: z.number().int().positive().describe('Issue number'),
});

export const getIssue = defineTool({
	name: 'get_issue',
	description: 'Get details of a specific issue in a project',
	schema,
	category: 'issues',
	read_only: true,
	handler: async (input, ctx) => {
		return ctx.provider.issues.get(input.repo, input.issue_number);
	},
});
