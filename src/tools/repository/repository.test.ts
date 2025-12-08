/**
 * Repository Tools Tests - Unit tests for repository-related tools
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getFileContents } from './get-file.js';
import { getRepositoryTree } from './get-tree.js';
import { pushFiles } from './push-files.js';
import { listBranches } from './list-branches.js';
import { createBranch } from './create-branch.js';
import { listCommits } from './list-commits.js';
import { searchCode } from './search-code.js';

import {
	createMockToolContext,
	createMockFileContent,
	createMockDirectoryContent,
	createMockTreeEntry,
	createMockCommit,
	createMockBranch,
} from '../test-helpers.js';

import type { SearchCodeResult } from '../../providers/types.js';

// ============================================================================
// getFileContents Tests
// ============================================================================

describe('getFileContents', () => {
	it('should have correct tool definition', () => {
		assert.equal(getFileContents.name, 'get_file_contents');
		assert.equal(getFileContents.category, 'repository');
		assert.equal(getFileContents.read_only, true);
	});

	it('should call provider.repository.getContent with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_path: string | undefined;
		let called_ref: string | undefined;

		const ctx = createMockToolContext({
			repository: {
				getContent: async (repo, path, ref) => {
					called_repo = repo;
					called_path = path;
					called_ref = ref;
					return createMockFileContent();
				},
			},
		});

		await getFileContents.handler({
			repo: 'group/project',
			path: 'src/index.ts',
			ref: 'develop',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.equal(called_path, 'src/index.ts');
		assert.equal(called_ref, 'develop');
	});

	it('should return file content from provider', async () => {
		const expected_file = createMockFileContent({
			path: 'src/main.ts',
			name: 'main.ts',
			content: 'console.log("main");',
			size: 20,
		});

		const ctx = createMockToolContext({
			repository: {
				getContent: async () => expected_file,
			},
		});

		const result = await getFileContents.handler({
			repo: 'test/repo',
			path: 'src/main.ts',
		}, ctx);

		assert.equal(result.type, 'file');
		if (result.type === 'file') {
			assert.equal(result.path, 'src/main.ts');
			assert.equal(result.content, 'console.log("main");');
		}
	});

	it('should return directory content from provider', async () => {
		const expected_dir = createMockDirectoryContent({
			path: 'src',
			entries: [
				{ name: 'index.ts', path: 'src/index.ts', type: 'file', mode: '100644' },
				{ name: 'utils', path: 'src/utils', type: 'directory', mode: '040000' },
			],
		});

		const ctx = createMockToolContext({
			repository: {
				getContent: async () => expected_dir,
			},
		});

		const result = await getFileContents.handler({
			repo: 'test/repo',
			path: 'src',
		}, ctx);

		assert.equal(result.type, 'directory');
		if (result.type === 'directory') {
			assert.equal(result.entries.length, 2);
			assert.equal(result.entries[0].name, 'index.ts');
		}
	});

	it('should handle ref as undefined', async () => {
		let called_ref: string | undefined = 'should-be-undefined';

		const ctx = createMockToolContext({
			repository: {
				getContent: async (_repo, _path, ref) => {
					called_ref = ref;
					return createMockFileContent();
				},
			},
		});

		await getFileContents.handler({ repo: 'test/repo', path: 'README.md' }, ctx);

		assert.equal(called_ref, undefined);
	});
});

// ============================================================================
// getRepositoryTree Tests
// ============================================================================

describe('getRepositoryTree', () => {
	it('should have correct tool definition', () => {
		assert.equal(getRepositoryTree.name, 'get_repository_tree');
		assert.equal(getRepositoryTree.category, 'repository');
		assert.equal(getRepositoryTree.read_only, true);
	});

	it('should call provider.repository.getTree with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				getTree: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return [];
				},
			},
		});

		await getRepositoryTree.handler({
			repo: 'group/project',
			path: 'src',
			ref: 'main',
			recursive: true,
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, { path: 'src', ref: 'main', recursive: true });
	});

	it('should return tree entries from provider', async () => {
		const expected_entries = [
			createMockTreeEntry({ name: 'index.ts', path: 'src/index.ts', type: 'file' }),
			createMockTreeEntry({ name: 'utils', path: 'src/utils', type: 'directory' }),
			createMockTreeEntry({ name: 'config.json', path: 'src/config.json', type: 'file' }),
		];

		const ctx = createMockToolContext({
			repository: {
				getTree: async () => expected_entries,
			},
		});

		const result = await getRepositoryTree.handler({ repo: 'test/repo' }, ctx);

		assert.equal(result.length, 3);
		assert.equal(result[0].name, 'index.ts');
		assert.equal(result[1].type, 'directory');
	});

	it('should pass pagination parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				getTree: async (_repo, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await getRepositoryTree.handler({
			repo: 'test/repo',
			page: 2,
			per_page: 50,
		}, ctx);

		assert.deepEqual(called_params, { page: 2, per_page: 50 });
	});
});

// ============================================================================
// pushFiles Tests
// ============================================================================

describe('pushFiles', () => {
	it('should have correct tool definition', () => {
		assert.equal(pushFiles.name, 'push_files');
		assert.equal(pushFiles.category, 'repository');
		assert.equal(pushFiles.read_only, false);
	});

	it('should call provider.repository.commit with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				commit: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return createMockCommit();
				},
			},
		});

		await pushFiles.handler({
			repo: 'group/project',
			branch: 'feature/new',
			message: 'Add new feature',
			actions: [
				{ action: 'create', path: 'src/new.ts', content: 'export const x = 1;' },
			],
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, {
			branch: 'feature/new',
			message: 'Add new feature',
			actions: [
				{ action: 'create', path: 'src/new.ts', content: 'export const x = 1;' },
			],
		});
	});

	it('should support multiple file actions', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				commit: async (_repo, params) => {
					called_params = params;
					return createMockCommit();
				},
			},
		});

		await pushFiles.handler({
			repo: 'test/repo',
			branch: 'main',
			message: 'Refactor code',
			actions: [
				{ action: 'update', path: 'src/index.ts', content: 'new content' },
				{ action: 'delete', path: 'src/old.ts' },
				{ action: 'move', path: 'src/renamed.ts', previous_path: 'src/original.ts' },
				{ action: 'create', path: 'src/new.ts', content: 'created' },
			],
		}, ctx);

		const params = called_params as { actions: unknown[] };
		assert.equal(params.actions.length, 4);
	});

	it('should pass optional parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				commit: async (_repo, params) => {
					called_params = params;
					return createMockCommit();
				},
			},
		});

		await pushFiles.handler({
			repo: 'test/repo',
			branch: 'feature/test',
			message: 'Commit message',
			actions: [{ action: 'create', path: 'test.txt', content: 'test' }],
			base_branch: 'main',
			author_name: 'Test Author',
			author_email: 'test@example.com',
		}, ctx);

		assert.deepEqual(called_params, {
			branch: 'feature/test',
			message: 'Commit message',
			actions: [{ action: 'create', path: 'test.txt', content: 'test' }],
			base_branch: 'main',
			author_name: 'Test Author',
			author_email: 'test@example.com',
		});
	});

	it('should return commit from provider', async () => {
		const expected_commit = createMockCommit({
			sha: 'newcommit123',
			message: 'New commit',
		});

		const ctx = createMockToolContext({
			repository: {
				commit: async () => expected_commit,
			},
		});

		const result = await pushFiles.handler({
			repo: 'test/repo',
			branch: 'main',
			message: 'New commit',
			actions: [{ action: 'create', path: 'file.txt', content: 'content' }],
		}, ctx);

		assert.equal(result.sha, 'newcommit123');
		assert.equal(result.message, 'New commit');
	});
});

// ============================================================================
// listBranches Tests
// ============================================================================

describe('listBranches', () => {
	it('should have correct tool definition', () => {
		assert.equal(listBranches.name, 'list_branches');
		assert.equal(listBranches.category, 'repository');
		assert.equal(listBranches.read_only, true);
	});

	it('should call provider.repository.listBranches with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				listBranches: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return [];
				},
			},
		});

		await listBranches.handler({
			repo: 'group/project',
			search: 'feature',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, { search: 'feature' });
	});

	it('should return branches from provider', async () => {
		const expected_branches = [
			createMockBranch({ name: 'main', default: true }),
			createMockBranch({ name: 'develop', default: false }),
			createMockBranch({ name: 'feature/test', default: false }),
		];

		const ctx = createMockToolContext({
			repository: {
				listBranches: async () => expected_branches,
			},
		});

		const result = await listBranches.handler({ repo: 'test/repo' }, ctx);

		assert.equal(result.length, 3);
		assert.equal(result[0].name, 'main');
		assert.equal(result[0].default, true);
	});

	it('should pass pagination parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				listBranches: async (_repo, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await listBranches.handler({
			repo: 'test/repo',
			page: 3,
			per_page: 25,
		}, ctx);

		assert.deepEqual(called_params, { page: 3, per_page: 25 });
	});
});

// ============================================================================
// createBranch Tests
// ============================================================================

describe('createBranch', () => {
	it('should have correct tool definition', () => {
		assert.equal(createBranch.name, 'create_branch');
		assert.equal(createBranch.category, 'repository');
		assert.equal(createBranch.read_only, false);
	});

	it('should call provider.repository.createBranch with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				createBranch: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return createMockBranch();
				},
			},
		});

		await createBranch.handler({
			repo: 'group/project',
			name: 'feature/new',
			ref: 'main',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, { name: 'feature/new', ref: 'main' });
	});

	it('should return created branch from provider', async () => {
		const expected_branch = createMockBranch({
			name: 'feature/awesome',
			sha: 'newbranchsha',
			protected: false,
		});

		const ctx = createMockToolContext({
			repository: {
				createBranch: async () => expected_branch,
			},
		});

		const result = await createBranch.handler({
			repo: 'test/repo',
			name: 'feature/awesome',
			ref: 'develop',
		}, ctx);

		assert.equal(result.name, 'feature/awesome');
		assert.equal(result.sha, 'newbranchsha');
	});
});

// ============================================================================
// listCommits Tests
// ============================================================================

describe('listCommits', () => {
	it('should have correct tool definition', () => {
		assert.equal(listCommits.name, 'list_commits');
		assert.equal(listCommits.category, 'repository');
		assert.equal(listCommits.read_only, true);
	});

	it('should call provider.repository.listCommits with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				listCommits: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return [];
				},
			},
		});

		await listCommits.handler({
			repo: 'group/project',
			ref: 'main',
			path: 'src/',
			author: 'test@example.com',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, {
			ref: 'main',
			path: 'src/',
			author: 'test@example.com',
		});
	});

	it('should pass all filter parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				listCommits: async (_repo, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await listCommits.handler({
			repo: 'test/repo',
			ref: 'develop',
			path: 'src/index.ts',
			since: '2024-01-01T00:00:00Z',
			until: '2024-12-31T23:59:59Z',
			author: 'dev@example.com',
			with_stats: true,
			page: 1,
			per_page: 100,
		}, ctx);

		assert.deepEqual(called_params, {
			ref: 'develop',
			path: 'src/index.ts',
			since: '2024-01-01T00:00:00Z',
			until: '2024-12-31T23:59:59Z',
			author: 'dev@example.com',
			with_stats: true,
			page: 1,
			per_page: 100,
		});
	});

	it('should return commits from provider', async () => {
		const expected_commits = [
			createMockCommit({ sha: 'commit1', message: 'First commit' }),
			createMockCommit({ sha: 'commit2', message: 'Second commit' }),
		];

		const ctx = createMockToolContext({
			repository: {
				listCommits: async () => expected_commits,
			},
		});

		const result = await listCommits.handler({ repo: 'test/repo' }, ctx);

		assert.equal(result.length, 2);
		assert.equal(result[0].sha, 'commit1');
		assert.equal(result[1].message, 'Second commit');
	});
});

// ============================================================================
// searchCode Tests
// ============================================================================

describe('searchCode', () => {
	it('should have correct tool definition', () => {
		assert.equal(searchCode.name, 'search_code');
		assert.equal(searchCode.category, 'repository');
		assert.equal(searchCode.read_only, true);
	});

	it('should call provider.repository.searchCode with correct parameters', async () => {
		let called_repo: string | undefined;
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				searchCode: async (repo, params) => {
					called_repo = repo;
					called_params = params;
					return [];
				},
			},
		});

		await searchCode.handler({
			repo: 'group/project',
			query: 'TODO',
			ref: 'main',
		}, ctx);

		assert.equal(called_repo, 'group/project');
		assert.deepEqual(called_params, { query: 'TODO', ref: 'main' });
	});

	it('should return search results from provider', async () => {
		const expected_results: SearchCodeResult[] = [
			{ path: 'src/index.ts', matched_lines: ['// TODO: fix this'], ref: 'main' },
			{ path: 'src/utils.ts', matched_lines: ['// TODO: refactor'], ref: 'main' },
		];

		const ctx = createMockToolContext({
			repository: {
				searchCode: async () => expected_results,
			},
		});

		const result = await searchCode.handler({
			repo: 'test/repo',
			query: 'TODO',
		}, ctx);

		assert.equal(result.length, 2);
		assert.equal(result[0].path, 'src/index.ts');
		assert.equal(result[1].matched_lines[0], '// TODO: refactor');
	});

	it('should handle empty search results', async () => {
		const ctx = createMockToolContext({
			repository: {
				searchCode: async () => [],
			},
		});

		const result = await searchCode.handler({
			repo: 'test/repo',
			query: 'nonexistent',
		}, ctx);

		assert.equal(result.length, 0);
	});

	it('should pass pagination parameters', async () => {
		let called_params: unknown;

		const ctx = createMockToolContext({
			repository: {
				searchCode: async (_repo, params) => {
					called_params = params;
					return [];
				},
			},
		});

		await searchCode.handler({
			repo: 'test/repo',
			query: 'function',
			page: 2,
			per_page: 20,
		}, ctx);

		assert.deepEqual(called_params, { query: 'function', page: 2, per_page: 20 });
	});
});
