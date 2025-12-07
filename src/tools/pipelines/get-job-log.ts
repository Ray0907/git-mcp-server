/**
 * get_job_log - Get the log output of a CI/CD job
 */

import { z } from 'zod';
import { defineTool, repoParam } from '../define.js';

const schema = z.object({
	repo: repoParam,
	job_id: z.number().int().positive().describe('Job ID'),
});

export const getJobLog = defineTool({
	name: 'get_job_log',
	description: 'Get the log/trace output of a CI/CD job',
	schema,
	category: 'ci',
	read_only: true,
	handler: async (input, ctx) => {
		const log = await ctx.provider.ci.getJobLog(input.repo, input.job_id);
		return { job_id: input.job_id, log };
	},
});
