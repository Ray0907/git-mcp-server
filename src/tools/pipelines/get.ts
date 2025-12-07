/**
 * get_pipeline - Get details of a specific CI/CD pipeline
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	pipeline_id: z.number().int().positive().describe('Pipeline/workflow run ID'),
});

export const getPipeline = defineTool({
	name: 'get_pipeline',
	description: 'Get details of a specific CI/CD pipeline (workflow run in GitHub)',
	schema,
	category: 'ci',
	read_only: true,
	handler: async (input, ctx) => {
		return ctx.provider.ci.getPipeline(input.repo, input.pipeline_id);
	},
});
