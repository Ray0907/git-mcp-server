/**
 * get_repository_tree - List directory structure of a repository
 *
 * AI needs to browse and understand project structure
 */

import { z } from 'zod';
import { defineTool, repoParam, withPagination } from '../define.js';

const schema = withPagination(
	z.object({
		repo: repoParam,
		path: z.string().optional().describe('Path inside repository (default: root)'),
		ref: z.string().optional().describe('Branch name, tag, or commit SHA'),
		recursive: z.boolean().optional().describe('Get tree recursively (default: false)'),
	})
);

export const getRepositoryTree = defineTool({
	name: 'get_repository_tree',
	description: 'List files and directories in a repository. Use recursive=true to get full tree.',
	schema,
	category: 'repository',
	read_only: true,
	handler: async (input, ctx) => {
		const { repo, ...params } = input;
		return ctx.provider.repository.getTree(repo, params);
	},
});
