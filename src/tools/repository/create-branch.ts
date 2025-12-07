/**
 * create_branch - Create a new branch
 *
 * Essential for AI workflows - create feature branches before making changes
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	name: z.string().describe('Name for the new branch'),
	ref: z.string().describe('Source branch/commit/tag to create from'),
});

export const createBranch = defineTool({
	name: 'create_branch',
	description: 'Create a new branch in the repository. Use this before making code changes to work on a separate branch.',
	schema,
	category: 'repository',
	read_only: false,
	handler: async (input, ctx) => {
		const { repo, name, ref } = input;
		return ctx.provider.repository.createBranch(repo, { name, ref });
	},
});
