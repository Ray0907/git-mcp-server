/**
 * defineTool Helper Tests - Unit tests for tool definition utilities
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

import { defineTool, repoParam, paginationParams, withPagination } from './define.js';

// ============================================================================
// defineTool Tests
// ============================================================================

describe('defineTool', () => {
	it('should return the tool definition unchanged', () => {
		const schema = z.object({ test: z.string() });
		const handler = async () => ({ result: 'ok' });

		const tool = defineTool({
			name: 'test_tool',
			description: 'A test tool',
			schema,
			handler,
		});

		assert.equal(tool.name, 'test_tool');
		assert.equal(tool.description, 'A test tool');
		assert.equal(tool.schema, schema);
		assert.equal(tool.handler, handler);
	});

	it('should accept optional category', () => {
		const tool = defineTool({
			name: 'categorized_tool',
			description: 'Tool with category',
			schema: z.object({}),
			category: 'test-category',
			handler: async () => ({}),
		});

		assert.equal(tool.category, 'test-category');
	});

	it('should accept optional read_only flag', () => {
		const read_only_tool = defineTool({
			name: 'readonly_tool',
			description: 'Read only tool',
			schema: z.object({}),
			read_only: true,
			handler: async () => ({}),
		});

		const write_tool = defineTool({
			name: 'write_tool',
			description: 'Write tool',
			schema: z.object({}),
			read_only: false,
			handler: async () => ({}),
		});

		assert.equal(read_only_tool.read_only, true);
		assert.equal(write_tool.read_only, false);
	});

	it('should accept optional tags', () => {
		const tool = defineTool({
			name: 'tagged_tool',
			description: 'Tool with tags',
			schema: z.object({}),
			tags: ['alpha', 'beta', 'experimental'],
			handler: async () => ({}),
		});

		assert.deepEqual(tool.tags, ['alpha', 'beta', 'experimental']);
	});

	it('should throw error for invalid tool name starting with number', () => {
		assert.throws(
			() => defineTool({
				name: '1invalid_name',
				description: 'Invalid',
				schema: z.object({}),
				handler: async () => ({}),
			}),
			/Invalid tool name/
		);
	});

	it('should throw error for tool name with uppercase letters', () => {
		assert.throws(
			() => defineTool({
				name: 'InvalidName',
				description: 'Invalid',
				schema: z.object({}),
				handler: async () => ({}),
			}),
			/Invalid tool name/
		);
	});

	it('should throw error for tool name with hyphens', () => {
		assert.throws(
			() => defineTool({
				name: 'invalid-name',
				description: 'Invalid',
				schema: z.object({}),
				handler: async () => ({}),
			}),
			/Invalid tool name/
		);
	});

	it('should throw error for tool name with spaces', () => {
		assert.throws(
			() => defineTool({
				name: 'invalid name',
				description: 'Invalid',
				schema: z.object({}),
				handler: async () => ({}),
			}),
			/Invalid tool name/
		);
	});

	it('should accept valid snake_case names', () => {
		const valid_names = [
			'get_issue',
			'list_pull_requests',
			'create_branch',
			'a',
			'tool123',
			'get_file_contents_v2',
		];

		for (const name of valid_names) {
			assert.doesNotThrow(
				() => defineTool({
					name,
					description: 'Valid tool',
					schema: z.object({}),
					handler: async () => ({}),
				}),
				`Expected ${name} to be valid`
			);
		}
	});
});

// ============================================================================
// repoParam Tests
// ============================================================================

describe('repoParam', () => {
	it('should be a string schema', () => {
		const result = repoParam.safeParse('group/project');
		assert.equal(result.success, true);
	});

	it('should accept GitLab style paths', () => {
		const valid_paths = [
			'group/project',
			'org/subgroup/project',
			'user/repo',
			'123',
		];

		for (const path of valid_paths) {
			const result = repoParam.safeParse(path);
			assert.equal(result.success, true, `Expected ${path} to be valid`);
		}
	});

	it('should reject non-string values', () => {
		const invalid_values = [123, null, undefined, {}, []];

		for (const value of invalid_values) {
			const result = repoParam.safeParse(value);
			assert.equal(result.success, false, `Expected ${JSON.stringify(value)} to be invalid`);
		}
	});

	it('should have a description', () => {
		assert.ok(repoParam.description);
		assert.ok(repoParam.description.includes('Repository'));
	});
});

// ============================================================================
// paginationParams Tests
// ============================================================================

describe('paginationParams', () => {
	it('should accept valid pagination values', () => {
		const result = paginationParams.safeParse({ page: 1, per_page: 20 });
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.page, 1);
			assert.equal(result.data.per_page, 20);
		}
	});

	it('should accept empty object (all optional)', () => {
		const result = paginationParams.safeParse({});
		assert.equal(result.success, true);
	});

	it('should accept only page', () => {
		const result = paginationParams.safeParse({ page: 5 });
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.page, 5);
			assert.equal(result.data.per_page, undefined);
		}
	});

	it('should accept only per_page', () => {
		const result = paginationParams.safeParse({ per_page: 50 });
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.page, undefined);
			assert.equal(result.data.per_page, 50);
		}
	});

	it('should reject page less than 1', () => {
		const result = paginationParams.safeParse({ page: 0 });
		assert.equal(result.success, false);
	});

	it('should reject negative page', () => {
		const result = paginationParams.safeParse({ page: -1 });
		assert.equal(result.success, false);
	});

	it('should reject per_page less than 1', () => {
		const result = paginationParams.safeParse({ per_page: 0 });
		assert.equal(result.success, false);
	});

	it('should reject per_page greater than 100', () => {
		const result = paginationParams.safeParse({ per_page: 101 });
		assert.equal(result.success, false);
	});

	it('should accept per_page exactly 100', () => {
		const result = paginationParams.safeParse({ per_page: 100 });
		assert.equal(result.success, true);
	});

	it('should reject non-integer page', () => {
		const result = paginationParams.safeParse({ page: 1.5 });
		assert.equal(result.success, false);
	});
});

// ============================================================================
// withPagination Tests
// ============================================================================

describe('withPagination', () => {
	it('should merge pagination params with custom schema', () => {
		const custom_schema = z.object({
			search: z.string(),
			active: z.boolean(),
		});

		const merged = withPagination(custom_schema);

		const result = merged.safeParse({
			search: 'test',
			active: true,
			page: 2,
			per_page: 25,
		});

		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.search, 'test');
			assert.equal(result.data.active, true);
			assert.equal(result.data.page, 2);
			assert.equal(result.data.per_page, 25);
		}
	});

	it('should allow omitting pagination params', () => {
		const custom_schema = z.object({
			name: z.string(),
		});

		const merged = withPagination(custom_schema);

		const result = merged.safeParse({ name: 'test' });

		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.name, 'test');
			assert.equal(result.data.page, undefined);
			assert.equal(result.data.per_page, undefined);
		}
	});

	it('should enforce pagination constraints after merge', () => {
		const custom_schema = z.object({
			query: z.string(),
		});

		const merged = withPagination(custom_schema);

		const result = merged.safeParse({
			query: 'test',
			per_page: 200, // Exceeds max
		});

		assert.equal(result.success, false);
	});

	it('should work with empty custom schema', () => {
		const empty_schema = z.object({});
		const merged = withPagination(empty_schema);

		const result = merged.safeParse({ page: 1, per_page: 10 });

		assert.equal(result.success, true);
	});
});
