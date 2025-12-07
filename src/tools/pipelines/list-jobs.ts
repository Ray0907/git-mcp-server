/**
 * list_pipeline_jobs - List jobs in a CI/CD pipeline
 */

import { z } from 'zod';
import { defineTool, repoParam, withPagination } from '../define.js';

const schema = withPagination(
	z.object({
		repo: repoParam,
		pipeline_id: z.number().int().positive().describe('Pipeline/workflow run ID'),
		status: z
			.enum(['pending', 'running', 'failed', 'success', 'canceled', 'skipped'])
			.optional()
			.describe('Filter by job status'),
	})
);

export const listPipelineJobs = defineTool({
	name: 'list_pipeline_jobs',
	description: 'List all jobs in a CI/CD pipeline to see results',
	schema,
	category: 'ci',
	read_only: true,
	handler: async (input, ctx) => {
		const { repo, pipeline_id, ...params } = input;
		return ctx.provider.ci.listJobs(repo, pipeline_id, params);
	},
});
