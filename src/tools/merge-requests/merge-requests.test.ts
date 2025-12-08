/**
 * Merge Requests Tools Tests - Unit tests for PR/MR-related tools
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getPullRequest } from './get.js';
import { listPullRequests } from './list.js';
import { createPullRequest } from './create.js';
import { getPullRequestDiffs } from './get-diffs.js';
import { mergePullRequest } from './merge.js';

import {
	createMockToolContext,
	createMockPullRequest,
} from '../test-helpers.js';

import type { PullRequestDiff } from '../../providers/types.js';

// ============================================================================
// getPullRequest Tests
// ============================================================================

describe('getPullRequest', () => {
	it('should have correct tool definition', () => {
		assert.equal(getPullRequest.name, 'get_pull_request');
		assert.equal(getPullRequest.category, 'pull-requests');
		assert.equal(getPullRequest.read_only, true);
	});

	it('should call provider.pullRequests.get with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_pr_number: number | undefined;

		const ctx = createMockToolContext({
			pullRequests: {
				get: async (repo, pr_number) => {
					called_repo = repo;
					called_pr_number = pr_number;
					return createMockPullRequest({ iid: pr_number });
				},
			},
		});

		const result = await getPullRequest.handler({ repo: 'group/project', pr_number: 10 }, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_pr_number, 10);
		assert.equal(result.iid, 10);
	});

	it('should return pull request data from provider', async () => {
		const expected_pr = createMockPullRequest({
			id: 500,
			iid: 25,
			title: 'Feature PR',
			state: 'merged',
			source_branch: 'feature/awesome',
			target_branch: 'develop',
		});

		const ctx = createMockToolContext({
			pullRequests: {
				get: async () => expected_pr,
			},
		});

		const result = await getPullRequest.handler({ repo: 'test/repo', pr_number: 25 }, ctx);

		assert.equal(result.id, 500);
		assert.equal(result.title, 'Feature PR');
		assert.equal(result.state, 'merged');
		assert.equal(result.source_branch, 'feature/awesome');
	});

	it('should propagate errors from provider', async () => {
		const ctx = createMockToolContext({
			pullRequests: {
				get: async () => {
					throw new Error('PR not found');
				},
			},
		});

		await assert.rejects(
			async () => getPullRequest.handler({ repo: 'test/repo', pr_number: 999 }, ctx),
			{ message: 'PR not found' }
		);
	});
});

// ============================================================================
// listPullRequests Tests
// ============================================================================

describe('listPullRequests', () => {
	it('should have correct tool definition', () => {
		assert.equal(listPullRequests.name, 'list_pull_requests');
		assert.equal(listPullRequests.category, 'pull-requests');
		assert.equal(listPullRequests.read_only, true);
	});

	it('should call provider.pullRequests.list with repo and params', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			pullRequests: {
				list: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return [createMockPullRequest()];
				},
			},
		});

		await listPullRequests.handler({
			repo: 'group/project',
			state: 'open',
			target_branch: 'main',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, { state: 'open', target_branch: 'main' });
	});

	it('should pass all filter parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			pullRequests: {
				list: async (_repo, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await listPullRequests.handler({
			repo: 'test/repo',
			state: 'merged',
			source_branch: 'feature/test',
			target_branch: 'main',
			labels: ['enhancement'],
			search: 'feature',
			sort: 'updated',
			direction: 'desc',
			page: 2,
			per_page: 25,
		}, ctx);

		assert.deepEqual(called_params, {
			state: 'merged',
			source_branch: 'feature/test',
			target_branch: 'main',
			labels: ['enhancement'],
			search: 'feature',
			sort: 'updated',
			direction: 'desc',
			page: 2,
			per_page: 25,
		});
	});

	it('should return list of pull requests from provider', async () => {
		const expected_prs = [
			createMockPullRequest({ iid: 1, title: 'PR 1' }),
			createMockPullRequest({ iid: 2, title: 'PR 2' }),
		];

		const ctx = createMockToolContext({
			pullRequests: {
				list: async () => expected_prs,
			},
		});

		const result = await listPullRequests.handler({ repo: 'test/repo' }, ctx);

		assert.equal(result.length, 2);
		assert.equal(result[0].title, 'PR 1');
		assert.equal(result[1].title, 'PR 2');
	});

	it('should handle empty result', async () => {
		const ctx = createMockToolContext({
			pullRequests: {
				list: async () => [],
			},
		});

		const result = await listPullRequests.handler({ repo: 'test/repo', state: 'closed' }, ctx);

		assert.equal(result.length, 0);
	});
});

// ============================================================================
// createPullRequest Tests
// ============================================================================

describe('createPullRequest', () => {
	it('should have correct tool definition', () => {
		assert.equal(createPullRequest.name, 'create_pull_request');
		assert.equal(createPullRequest.category, 'pull-requests');
		assert.equal(createPullRequest.read_only, false);
	});

	it('should call provider.pullRequests.create with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			pullRequests: {
				create: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return createMockPullRequest();
				},
			},
		});

		await createPullRequest.handler({
			repo: 'group/project',
			source_branch: 'feature/new',
			target_branch: 'main',
			title: 'New Feature',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, {
			source_branch: 'feature/new',
			target_branch: 'main',
			title: 'New Feature',
		});
	});

	it('should pass all optional parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			pullRequests: {
				create: async (_repo, params) => {
					called_params = params;
					return createMockPullRequest();
				},
			},
		});

		await createPullRequest.handler({
			repo: 'test/repo',
			source_branch: 'feature/test',
			target_branch: 'develop',
			title: 'Test PR',
			description: 'PR description in Markdown',
			assignee_ids: [1, 2],
			reviewer_ids: [3, 4],
			labels: ['feature', 'review-needed'],
			draft: true,
		}, ctx);

		assert.deepEqual(called_params, {
			source_branch: 'feature/test',
			target_branch: 'develop',
			title: 'Test PR',
			description: 'PR description in Markdown',
			assignee_ids: [1, 2],
			reviewer_ids: [3, 4],
			labels: ['feature', 'review-needed'],
			draft: true,
		});
	});

	it('should return created pull request from provider', async () => {
		const created_pr = createMockPullRequest({
			id: 600,
			iid: 30,
			title: 'Created PR',
			source_branch: 'feature/new',
			target_branch: 'main',
			draft: true,
		});

		const ctx = createMockToolContext({
			pullRequests: {
				create: async () => created_pr,
			},
		});

		const result = await createPullRequest.handler({
			repo: 'test/repo',
			source_branch: 'feature/new',
			target_branch: 'main',
			title: 'Created PR',
			draft: true,
		}, ctx);

		assert.equal(result.id, 600);
		assert.equal(result.iid, 30);
		assert.equal(result.draft, true);
	});
});

// ============================================================================
// getPullRequestDiffs Tests
// ============================================================================

describe('getPullRequestDiffs', () => {
	it('should have correct tool definition', () => {
		assert.equal(getPullRequestDiffs.name, 'get_pull_request_diffs');
		assert.equal(getPullRequestDiffs.category, 'pull-requests');
		assert.equal(getPullRequestDiffs.read_only, true);
	});

	it('should call provider.pullRequests.getDiffs with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_pr_number: number | undefined;

		const ctx = createMockToolContext({
			pullRequests: {
				getDiffs: async (repo, pr_number) => {
					called_repo = repo;
					called_pr_number = pr_number;
					return [];
				},
			},
		});

		await getPullRequestDiffs.handler({ repo: 'group/project', pr_number: 15 }, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_pr_number, 15);
	});

	it('should return diffs from provider', async () => {
		const expected_diffs: PullRequestDiff[] = [
			{
				old_path: 'src/old.ts',
				new_path: 'src/new.ts',
				new_file: false,
				renamed_file: true,
				deleted_file: false,
				diff: '@@ -1 +1 @@\n-old\n+new',
			},
			{
				old_path: 'README.md',
				new_path: 'README.md',
				new_file: false,
				renamed_file: false,
				deleted_file: false,
				diff: '@@ -1,3 +1,4 @@\n# Title\n+New line',
			},
		];

		const ctx = createMockToolContext({
			pullRequests: {
				getDiffs: async () => expected_diffs,
			},
		});

		const result = await getPullRequestDiffs.handler({ repo: 'test/repo', pr_number: 5 }, ctx);

		assert.equal(result.length, 2);
		assert.equal(result[0].renamed_file, true);
		assert.equal(result[1].old_path, 'README.md');
	});

	it('should handle empty diffs', async () => {
		const ctx = createMockToolContext({
			pullRequests: {
				getDiffs: async () => [],
			},
		});

		const result = await getPullRequestDiffs.handler({ repo: 'test/repo', pr_number: 1 }, ctx);

		assert.equal(result.length, 0);
	});
});

// ============================================================================
// mergePullRequest Tests
// ============================================================================

describe('mergePullRequest', () => {
	it('should have correct tool definition', () => {
		assert.equal(mergePullRequest.name, 'merge_pull_request');
		assert.equal(mergePullRequest.category, 'pull-requests');
		assert.equal(mergePullRequest.read_only, false);
	});

	it('should call provider.pullRequests.merge with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_pr_number: number | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			pullRequests: {
				merge: async (repo, pr_number, params) => {
					called_repo = repo;
					called_pr_number = pr_number;
					called_params = params;
					return createMockPullRequest({ state: 'merged' });
				},
			},
		});

		await mergePullRequest.handler({ repo: 'group/project', pr_number: 20 }, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_pr_number, 20);
		assert.deepEqual(called_params, {});
	});

	it('should pass merge options', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			pullRequests: {
				merge: async (_repo, _pr_number, params) => {
					called_params = params;
					return createMockPullRequest({ state: 'merged' });
				},
			},
		});

		await mergePullRequest.handler({
			repo: 'test/repo',
			pr_number: 10,
			commit_message: 'Merge feature into main',
			squash: true,
			delete_branch: true,
		}, ctx);

		assert.deepEqual(called_params, {
			commit_message: 'Merge feature into main',
			squash: true,
			delete_branch: true,
		});
	});

	it('should return merged pull request from provider', async () => {
		const merged_pr = createMockPullRequest({
			iid: 15,
			state: 'merged',
			merged_at: '2024-01-15T12:00:00Z',
		});

		const ctx = createMockToolContext({
			pullRequests: {
				merge: async () => merged_pr,
			},
		});

		const result = await mergePullRequest.handler({ repo: 'test/repo', pr_number: 15 }, ctx);

		assert.equal(result.iid, 15);
		assert.equal(result.state, 'merged');
		assert.equal(result.merged_at, '2024-01-15T12:00:00Z');
	});

	it('should propagate merge errors', async () => {
		const ctx = createMockToolContext({
			pullRequests: {
				merge: async () => {
					throw new Error('Cannot merge: conflicts');
				},
			},
		});

		await assert.rejects(
			async () => mergePullRequest.handler({ repo: 'test/repo', pr_number: 5 }, ctx),
			{ message: 'Cannot merge: conflicts' }
		);
	});
});
