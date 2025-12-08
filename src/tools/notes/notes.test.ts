/**
 * Notes/Comments Tools Tests - Unit tests for comment-related tools
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createComment } from './create.js';
import { listComments } from './list.js';

import {
	createMockToolContext,
	createMockComment,
} from '../test-helpers.js';

// ============================================================================
// createComment Tests
// ============================================================================

describe('createComment', () => {
	it('should have correct tool definition', () => {
		assert.equal(createComment.name, 'create_comment');
		assert.equal(createComment.category, 'comments');
		assert.equal(createComment.read_only, false);
	});

	it('should call issues.createComment for issue type', async () => {
		let called_repo: string | undefined;
		let called_number: number | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				createComment: async (repo, number, params) => {
					called_repo = repo;
					called_number = number;
					called_params = params;
					return createMockComment();
				},
			},
		});

		await createComment.handler({
			repo: 'group/project',
			type: 'issue',
			number: 42,
			body: 'This is a comment',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_number, 42);
		assert.deepEqual(called_params, { body: 'This is a comment' });
	});

	it('should call pullRequests.createComment for pull_request type', async () => {
		let called_repo: string | undefined;
		let called_number: number | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			pullRequests: {
				createComment: async (repo, number, params) => {
					called_repo = repo;
					called_number = number;
					called_params = params;
					return createMockComment();
				},
			},
		});

		await createComment.handler({
			repo: 'group/project',
			type: 'pull_request',
			number: 15,
			body: 'LGTM!',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_number, 15);
		assert.deepEqual(called_params, { body: 'LGTM!' });
	});

	it('should return created comment from provider', async () => {
		const expected_comment = createMockComment({
			id: 999,
			body: 'New comment body',
		});

		const ctx = createMockToolContext({
			issues: {
				createComment: async () => expected_comment,
			},
		});

		const result = await createComment.handler({
			repo: 'test/repo',
			type: 'issue',
			number: 10,
			body: 'New comment body',
		}, ctx);

		assert.equal(result.id, 999);
		assert.equal(result.body, 'New comment body');
	});

	it('should handle markdown content in body', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			pullRequests: {
				createComment: async (_repo, _number, params) => {
					called_params = params;
					return createMockComment();
				},
			},
		});

		const markdown_body = `
## Review Summary

- [x] Code quality
- [x] Tests pass
- [ ] Documentation

\`\`\`typescript
const x = 1;
\`\`\`
`;

		await createComment.handler({
			repo: 'test/repo',
			type: 'pull_request',
			number: 5,
			body: markdown_body,
		}, ctx);

		assert.deepEqual(called_params, { body: markdown_body });
	});
});

// ============================================================================
// listComments Tests
// ============================================================================

describe('listComments', () => {
	it('should have correct tool definition', () => {
		assert.equal(listComments.name, 'list_comments');
		assert.equal(listComments.category, 'comments');
		assert.equal(listComments.read_only, true);
	});

	it('should call issues.listComments for issue type', async () => {
		let called_repo: string | undefined;
		let called_number: number | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				listComments: async (repo, number, params) => {
					called_repo = repo;
					called_number = number;
					called_params = params;
					return [createMockComment()];
				},
			},
		});

		await listComments.handler({
			repo: 'group/project',
			type: 'issue',
			number: 42,
			sort: 'desc',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_number, 42);
		assert.deepEqual(called_params, { sort: 'desc' });
	});

	it('should call pullRequests.listComments for pull_request type', async () => {
		let called_repo: string | undefined;
		let called_number: number | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			pullRequests: {
				listComments: async (repo, number, params) => {
					called_repo = repo;
					called_number = number;
					called_params = params;
					return [createMockComment()];
				},
			},
		});

		await listComments.handler({
			repo: 'group/project',
			type: 'pull_request',
			number: 15,
			sort: 'asc',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_number, 15);
		assert.deepEqual(called_params, { sort: 'asc' });
	});

	it('should pass pagination parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			issues: {
				listComments: async (_repo, _number, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await listComments.handler({
			repo: 'test/repo',
			type: 'issue',
			number: 10,
			page: 2,
			per_page: 50,
		}, ctx);

		assert.deepEqual(called_params, { page: 2, per_page: 50 });
	});

	it('should return list of comments from provider', async () => {
		const expected_comments = [
			createMockComment({ id: 1, body: 'First comment' }),
			createMockComment({ id: 2, body: 'Second comment' }),
			createMockComment({ id: 3, body: 'Third comment' }),
		];

		const ctx = createMockToolContext({
			pullRequests: {
				listComments: async () => expected_comments,
			},
		});

		const result = await listComments.handler({
			repo: 'test/repo',
			type: 'pull_request',
			number: 5,
		}, ctx);

		assert.equal(result.length, 3);
		assert.equal(result[0].body, 'First comment');
		assert.equal(result[2].body, 'Third comment');
	});

	it('should handle empty comments list', async () => {
		const ctx = createMockToolContext({
			issues: {
				listComments: async () => [],
			},
		});

		const result = await listComments.handler({
			repo: 'test/repo',
			type: 'issue',
			number: 999,
		}, ctx);

		assert.equal(result.length, 0);
	});
});
