/**
 * get_file_contents - Get file or directory contents from a repository
 *
 * This is the most important tool - AI needs to read code!
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	path: z.string().describe('File or directory path in the repository'),
	ref: z.string().optional().describe('Branch name, tag, or commit SHA (default: default branch)'),
});

export const getFileContents = defineTool({
	name: 'get_file_contents',
	description: 'Get the contents of a file or directory from a repository',
	schema,
	category: 'repository',
	read_only: true,
	handler: async (input, ctx) => {
		return ctx.provider.repository.getContent(input.repo, input.path, input.ref);
	},
});
