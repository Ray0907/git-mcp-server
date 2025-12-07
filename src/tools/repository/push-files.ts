/**
 * push_files - Push multiple files in a single commit
 *
 * AI needs to make code changes - this is the way to do it
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const fileActionSchema = z.object({
	action: z.enum(['create', 'update', 'delete', 'move']).describe('Action to perform'),
	path: z.string().describe('Path of the file'),
	content: z.string().optional().describe('File content (required for create/update)'),
	previous_path: z.string().optional().describe('Original path (required for move)'),
});

const schema = z.object({
	repo: repoParam,
	branch: z.string().describe('Target branch name'),
	message: z.string().describe('Commit message'),
	actions: z.array(fileActionSchema).min(1).describe('File actions to perform'),
	base_branch: z.string().optional().describe('Branch to start from (for creating new branch)'),
	author_name: z.string().optional().describe('Commit author name'),
	author_email: z.string().email().optional().describe('Commit author email'),
});

export const pushFiles = defineTool({
	name: 'push_files',
	description: 'Push multiple files to a repository in a single commit. Supports create, update, delete, and move actions.',
	schema,
	category: 'repository',
	read_only: false,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.repository.commit(repo, params);
	},
});
