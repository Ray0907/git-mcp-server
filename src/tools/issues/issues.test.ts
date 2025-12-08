/**
 * Issues Tools Tests - Unit tests for issue-related tools
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getIssue } from './get.js';
import { listIssues } from './list.js';
import { createIssue } from './create.js';
import { updateIssue } from './update.js';

import {
	createMockToolContext,
	createMockIssue,
} from '../test-helpers.js';

// ============================================================================
// getIssue Tests
// ============================================================================

describe('getIssue', () => {
	it('should have correct tool definition', () => {
		assert.equal(getIssue.name, 'get_issue');
		assert.equal(getIssue.category, 'issues');
		assert.equal(getIssue.read_only, true);
	});

	it('should call provider.issues.get with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_issue_number: number | undefined;

		const ctx = createMockToolContext({
			issues: {
				get: async (repo, issue_number) => {
					called_repo = repo;
					called_issue_number = issue_number;
					return createMockIssue({ iid: issue_number });
				},
			},
		});

		const result = await getIssue.handler({ repo: 'group/project', issue_number: 42 }, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_issue_number, 42);
		assert.equal(result.iid, 42);
	});

	it('should return issue data from provider', async () => {
		const expected_issue = createMockIssue({
			id: 999,
			iid: 10,
			title: 'Specific Issue',
			state: 'closed',
		});

		const ctx = createMockToolContext({
			issues: {
				get: async () => expected_issue,
			},
		});

		const result = await getIssue.handler({ repo: 'test/repo', issue_number: 10 }, ctx);

		assert.equal(result.id, 999);
		assert.equal(result.iid, 10);
		assert.equal(result.title, 'Specific Issue');
		assert.equal(result.state, 'closed');
	});

	it('should propagate errors from provider', async () => {
		const ctx = createMockToolContext({
			issues: {
				get: async () => {
					throw new Error('Issue not found');
				},
			},
		});

		await assert.rejects(
			async () => getIssue.handler({ repo: 'test/repo', issue_number: 999 }, ctx),
			{ message: 'Issue not found' }
		);
	});
});

// ============================================================================
// listIssues Tests
// ============================================================================

describe('listIssues', () => {
	it('should have correct tool definition', () => {
		assert.equal(listIssues.name, 'list_issues');
		assert.equal(listIssues.category, 'issues');
		assert.equal(listIssues.read_only, true);
	});

	it('should call provider.issues.list with repo and params', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				list: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return [createMockIssue()];
				},
			},
		});

		await listIssues.handler({
			repo: 'group/project',
			state: 'open',
			labels: ['bug'],
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, { state: 'open', labels: ['bug'] });
	});

	it('should pass pagination parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				list: async (_repo, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await listIssues.handler({
			repo: 'test/repo',
			page: 2,
			per_page: 50,
		}, ctx);

		assert.deepEqual(called_params, { page: 2, per_page: 50 });
	});

	it('should return list of issues from provider', async () => {
		const expected_issues = [
			createMockIssue({ iid: 1, title: 'Issue 1' }),
			createMockIssue({ iid: 2, title: 'Issue 2' }),
			createMockIssue({ iid: 3, title: 'Issue 3' }),
		];

		const ctx = createMockToolContext({
			issues: {
				list: async () => expected_issues,
			},
		});

		const result = await listIssues.handler({ repo: 'test/repo' }, ctx);

		assert.equal(result.length, 3);
		assert.equal(result[0].title, 'Issue 1');
		assert.equal(result[2].title, 'Issue 3');
	});

	it('should handle empty result', async () => {
		const ctx = createMockToolContext({
			issues: {
				list: async () => [],
			},
		});

		const result = await listIssues.handler({ repo: 'test/repo', state: 'closed' }, ctx);

		assert.equal(result.length, 0);
	});

	it('should pass all filter parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				list: async (_repo, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await listIssues.handler({
			repo: 'test/repo',
			state: 'all',
			labels: ['bug', 'critical'],
			search: 'error',
			assignee_id: 123,
			author_id: 456,
			sort: 'updated',
			direction: 'desc',
		}, ctx);

		assert.deepEqual(called_params, {
			state: 'all',
			labels: ['bug', 'critical'],
			search: 'error',
			assignee_id: 123,
			author_id: 456,
			sort: 'updated',
			direction: 'desc',
		});
	});
});

// ============================================================================
// createIssue Tests
// ============================================================================

describe('createIssue', () => {
	it('should have correct tool definition', () => {
		assert.equal(createIssue.name, 'create_issue');
		assert.equal(createIssue.category, 'issues');
		assert.equal(createIssue.read_only, false);
	});

	it('should call provider.issues.create with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				create: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return createMockIssue({ title: 'New Issue' });
				},
			},
		});

		await createIssue.handler({
			repo: 'group/project',
			title: 'New Issue',
			description: 'Description here',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, {
			title: 'New Issue',
			description: 'Description here',
		});
	});

	it('should pass labels and assignee_ids', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				create: async (_repo, params) => {
					called_params = params;
					return createMockIssue();
				},
			},
		});

		await createIssue.handler({
			repo: 'test/repo',
			title: 'Bug Report',
			labels: ['bug', 'high-priority'],
			assignee_ids: [1, 2, 3],
		}, ctx);

		assert.deepEqual(called_params, {
			title: 'Bug Report',
			labels: ['bug', 'high-priority'],
			assignee_ids: [1, 2, 3],
		});
	});

	it('should return created issue from provider', async () => {
		const created_issue = createMockIssue({
			id: 500,
			iid: 50,
			title: 'Created Issue',
			state: 'open',
		});

		const ctx = createMockToolContext({
			issues: {
				create: async () => created_issue,
			},
		});

		const result = await createIssue.handler({
			repo: 'test/repo',
			title: 'Created Issue',
		}, ctx);

		assert.equal(result.id, 500);
		assert.equal(result.iid, 50);
		assert.equal(result.title, 'Created Issue');
	});
});

// ============================================================================
// updateIssue Tests
// ============================================================================

describe('updateIssue', () => {
	it('should have correct tool definition', () => {
		assert.equal(updateIssue.name, 'update_issue');
		assert.equal(updateIssue.category, 'issues');
		assert.equal(updateIssue.read_only, false);
	});

	it('should call provider.issues.update with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_issue_number: number | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				update: async (repo, issue_number, params) => {
					called_repo = repo;
					called_issue_number = issue_number;
					called_params = params;
					return createMockIssue();
				},
			},
		});

		await updateIssue.handler({
			repo: 'group/project',
			issue_number: 42,
			title: 'Updated Title',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_issue_number, 42);
		assert.deepEqual(called_params, { title: 'Updated Title' });
	});

	it('should pass state change parameter', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				update: async (_repo, _issue_number, params) => {
					called_params = params;
					return createMockIssue({ state: 'closed' });
				},
			},
		});

		await updateIssue.handler({
			repo: 'test/repo',
			issue_number: 10,
			state: 'closed',
		}, ctx);

		assert.deepEqual(called_params, { state: 'closed' });
	});

	it('should pass all update parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				update: async (_repo, _issue_number, params) => {
					called_params = params;
					return createMockIssue();
				},
			},
		});

		await updateIssue.handler({
			repo: 'test/repo',
			issue_number: 5,
			title: 'New Title',
			description: 'New Description',
			labels: ['updated-label'],
			assignee_ids: [100],
			state: 'open',
		}, ctx);

		assert.deepEqual(called_params, {
			title: 'New Title',
			description: 'New Description',
			labels: ['updated-label'],
			assignee_ids: [100],
			state: 'open',
		});
	});

	it('should return updated issue from provider', async () => {
		const updated_issue = createMockIssue({
			iid: 15,
			title: 'Updated Issue',
			state: 'closed',
		});

		const ctx = createMockToolContext({
			issues: {
				update: async () => updated_issue,
			},
		});

		const result = await updateIssue.handler({
			repo: 'test/repo',
			issue_number: 15,
			state: 'closed',
		}, ctx);

		assert.equal(result.iid, 15);
		assert.equal(result.title, 'Updated Issue');
		assert.equal(result.state, 'closed');
	});
});
