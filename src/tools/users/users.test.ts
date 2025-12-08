/**
 * Users Tools Tests - Unit tests for user-related tools
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getMe } from './get-me.js';

import {
	createMockToolContext,
	createMockUser,
} from '../test-helpers.js';

// ============================================================================
// getMe Tests
// ============================================================================

describe('getMe', () => {
	it('should have correct tool definition', () => {
		assert.equal(getMe.name, 'get_me');
		assert.equal(getMe.category, 'users');
		assert.equal(getMe.read_only, true);
	});

	it('should call provider.users.getMe', async () => {
		let called = false;

		const ctx = createMockToolContext({
			users: {
				getMe: async () => {
					called = true;
					return createMockUser();
				},
			},
		});

		await getMe.handler({}, ctx);

		assert.equal(called, true);
	});

	it('should return user data from provider', async () => {
		const expected_user = createMockUser({
			id: 12345,
			username: 'currentuser',
			name: 'Current User',
			avatar_url: 'https://example.com/avatar/current.png',
			web_url: 'https://example.com/currentuser',
		});

		const ctx = createMockToolContext({
			users: {
				getMe: async () => expected_user,
			},
		});

		const result = await getMe.handler({}, ctx);

		assert.equal(result.id, 12345);
		assert.equal(result.username, 'currentuser');
		assert.equal(result.name, 'Current User');
		assert.equal(result.avatar_url, 'https://example.com/avatar/current.png');
		assert.equal(result.web_url, 'https://example.com/currentuser');
	});

	it('should propagate authentication errors', async () => {
		const ctx = createMockToolContext({
			users: {
				getMe: async () => {
					throw new Error('401 Unauthorized');
				},
			},
		});

		await assert.rejects(
			async () => getMe.handler({}, ctx),
			{ message: '401 Unauthorized' }
		);
	});

	it('should handle user without avatar', async () => {
		const user_without_avatar = createMockUser({
			id: 999,
			avatar_url: undefined,
		});

		const ctx = createMockToolContext({
			users: {
				getMe: async () => user_without_avatar,
			},
		});

		const result = await getMe.handler({}, ctx);

		assert.equal(result.id, 999);
		assert.equal(result.avatar_url, undefined);
	});
});
