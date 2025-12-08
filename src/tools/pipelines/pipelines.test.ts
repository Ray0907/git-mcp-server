/**
 * Pipelines Tools Tests - Unit tests for CI/CD-related tools
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getPipeline } from './get.js';
import { listPipelines } from './list.js';
import { listPipelineJobs } from './list-jobs.js';
import { getJobLog } from './get-job-log.js';

import {
	createMockToolContext,
	createMockPipeline,
	createMockJob,
} from '../test-helpers.js';

// ============================================================================
// getPipeline Tests
// ============================================================================

describe('getPipeline', () => {
	it('should have correct tool definition', () => {
		assert.equal(getPipeline.name, 'get_pipeline');
		assert.equal(getPipeline.category, 'ci');
		assert.equal(getPipeline.read_only, true);
	});

	it('should call provider.ci.getPipeline with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_pipeline_id: number | undefined;

		const ctx = createMockToolContext({
			ci: {
				getPipeline: async (repo, pipeline_id) => {
					called_repo = repo;
					called_pipeline_id = pipeline_id;
					return createMockPipeline({ id: pipeline_id });
				},
			},
		});

		const result = await getPipeline.handler({
			repo: 'group/project',
			pipeline_id: 12345,
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_pipeline_id, 12345);
		assert.equal(result.id, 12345);
	});

	it('should return pipeline data from provider', async () => {
		const expected_pipeline = createMockPipeline({
			id: 99999,
			status: 'success',
			ref: 'main',
			sha: 'abc123xyz',
		});

		const ctx = createMockToolContext({
			ci: {
				getPipeline: async () => expected_pipeline,
			},
		});

		const result = await getPipeline.handler({
			repo: 'test/repo',
			pipeline_id: 99999,
		}, ctx);

		assert.equal(result.id, 99999);
		assert.equal(result.status, 'success');
		assert.equal(result.ref, 'main');
		assert.equal(result.sha, 'abc123xyz');
	});

	it('should propagate errors from provider', async () => {
		const ctx = createMockToolContext({
			ci: {
				getPipeline: async () => {
					throw new Error('Pipeline not found');
				},
			},
		});

		await assert.rejects(
			async () => getPipeline.handler({ repo: 'test/repo', pipeline_id: 404 }, ctx),
			{ message: 'Pipeline not found' }
		);
	});
});

// ============================================================================
// listPipelines Tests
// ============================================================================

describe('listPipelines', () => {
	it('should have correct tool definition', () => {
		assert.equal(listPipelines.name, 'list_pipelines');
		assert.equal(listPipelines.category, 'ci');
		assert.equal(listPipelines.read_only, true);
	});

	it('should call provider.ci.listPipelines with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			ci: {
				listPipelines: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return [];
				},
			},
		});

		await listPipelines.handler({
			repo: 'group/project',
			status: 'failed',
			ref: 'main',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, { status: 'failed', ref: 'main' });
	});

	it('should pass all filter parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			ci: {
				listPipelines: async (_repo, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await listPipelines.handler({
			repo: 'test/repo',
			status: 'running',
			ref: 'develop',
			sha: 'abc123',
			sort: 'desc',
			page: 2,
			per_page: 50,
		}, ctx);

		assert.deepEqual(called_params, {
			status: 'running',
			ref: 'develop',
			sha: 'abc123',
			sort: 'desc',
			page: 2,
			per_page: 50,
		});
	});

	it('should return list of pipelines from provider', async () => {
		const expected_pipelines = [
			createMockPipeline({ id: 1, status: 'success' }),
			createMockPipeline({ id: 2, status: 'failed' }),
			createMockPipeline({ id: 3, status: 'running' }),
		];

		const ctx = createMockToolContext({
			ci: {
				listPipelines: async () => expected_pipelines,
			},
		});

		const result = await listPipelines.handler({ repo: 'test/repo' }, ctx);

		assert.equal(result.length, 3);
		assert.equal(result[0].status, 'success');
		assert.equal(result[1].status, 'failed');
		assert.equal(result[2].status, 'running');
	});

	it('should handle empty result', async () => {
		const ctx = createMockToolContext({
			ci: {
				listPipelines: async () => [],
			},
		});

		const result = await listPipelines.handler({
			repo: 'test/repo',
			status: 'canceled',
		}, ctx);

		assert.equal(result.length, 0);
	});
});

// ============================================================================
// listPipelineJobs Tests
// ============================================================================

describe('listPipelineJobs', () => {
	it('should have correct tool definition', () => {
		assert.equal(listPipelineJobs.name, 'list_pipeline_jobs');
		assert.equal(listPipelineJobs.category, 'ci');
		assert.equal(listPipelineJobs.read_only, true);
	});

	it('should call provider.ci.listJobs with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_pipeline_id: number | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			ci: {
				listJobs: async (repo, pipeline_id, params) => {
					called_repo = repo;
					called_pipeline_id = pipeline_id;
					called_params = params;
					return [];
				},
			},
		});

		await listPipelineJobs.handler({
			repo: 'group/project',
			pipeline_id: 12345,
			status: 'failed',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_pipeline_id, 12345);
		assert.deepEqual(called_params, { status: 'failed' });
	});

	it('should pass pagination parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			ci: {
				listJobs: async (_repo, _pipeline_id, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await listPipelineJobs.handler({
			repo: 'test/repo',
			pipeline_id: 100,
			page: 3,
			per_page: 25,
		}, ctx);

		assert.deepEqual(called_params, { page: 3, per_page: 25 });
	});

	it('should return list of jobs from provider', async () => {
		const expected_jobs = [
			createMockJob({ id: 1, name: 'build', status: 'success', stage: 'build' }),
			createMockJob({ id: 2, name: 'test', status: 'success', stage: 'test' }),
			createMockJob({ id: 3, name: 'deploy', status: 'running', stage: 'deploy' }),
		];

		const ctx = createMockToolContext({
			ci: {
				listJobs: async () => expected_jobs,
			},
		});

		const result = await listPipelineJobs.handler({
			repo: 'test/repo',
			pipeline_id: 12345,
		}, ctx);

		assert.equal(result.length, 3);
		assert.equal(result[0].name, 'build');
		assert.equal(result[1].stage, 'test');
		assert.equal(result[2].status, 'running');
	});

	it('should handle empty jobs list', async () => {
		const ctx = createMockToolContext({
			ci: {
				listJobs: async () => [],
			},
		});

		const result = await listPipelineJobs.handler({
			repo: 'test/repo',
			pipeline_id: 999,
		}, ctx);

		assert.equal(result.length, 0);
	});
});

// ============================================================================
// getJobLog Tests
// ============================================================================

describe('getJobLog', () => {
	it('should have correct tool definition', () => {
		assert.equal(getJobLog.name, 'get_job_log');
		assert.equal(getJobLog.category, 'ci');
		assert.equal(getJobLog.read_only, true);
	});

	it('should call provider.ci.getJobLog with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_job_id: number | undefined;

		const ctx = createMockToolContext({
			ci: {
				getJobLog: async (repo, job_id) => {
					called_repo = repo;
					called_job_id = job_id;
					return 'Job log output';
				},
			},
		});

		await getJobLog.handler({ repo: 'group/project', job_id: 54321 }, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_job_id, 54321);
	});

	it('should return job_id and log in result', async () => {
		const expected_log = `
Running build...
[1/3] Compiling...
[2/3] Linking...
[3/3] Finished!
Build succeeded.
`;

		const ctx = createMockToolContext({
			ci: {
				getJobLog: async () => expected_log,
			},
		});

		const result = await getJobLog.handler({ repo: 'test/repo', job_id: 12345 }, ctx);

		assert.equal(result.job_id, 12345);
		assert.equal(result.log, expected_log);
		assert.ok(result.log.includes('Build succeeded'));
	});

	it('should handle empty log', async () => {
		const ctx = createMockToolContext({
			ci: {
				getJobLog: async () => '',
			},
		});

		const result = await getJobLog.handler({ repo: 'test/repo', job_id: 999 }, ctx);

		assert.equal(result.job_id, 999);
		assert.equal(result.log, '');
	});

	it('should propagate errors from provider', async () => {
		const ctx = createMockToolContext({
			ci: {
				getJobLog: async () => {
					throw new Error('Job not found');
				},
			},
		});

		await assert.rejects(
			async () => getJobLog.handler({ repo: 'test/repo', job_id: 404 }, ctx),
			{ message: 'Job not found' }
		);
	});
});
