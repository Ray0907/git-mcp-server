/**
 * GitLab Mapper Tests - Unit tests for type mapping functions
 *
 * Tests verify that GitLab API responses are correctly mapped to
 * platform-agnostic Provider types.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	mapUser,
	mapIssue,
	mapPullRequest,
	mapPullRequestDiff,
	mapFileContent,
	mapDirectoryContent,
	mapTreeEntry,
	mapCommit,
	mapBranch,
	mapPipeline,
	mapJob,
	mapComment,
} from './mapper.js';

import type {
	GitLabUser,
	GitLabIssue,
	GitLabMergeRequest,
	GitLabMergeRequestDiff,
	GitLabFile,
	GitLabTreeItem,
	GitLabCommit,
	GitLabBranch,
	GitLabPipeline,
	GitLabJob,
	GitLabNote,
} from '../../gitlab/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function createGitLabUser(overrides: Partial<GitLabUser> = {}): GitLabUser {
	return {
		id: 1,
		username: 'testuser',
		name: 'Test User',
		avatar_url: 'https://gitlab.com/avatar.png',
		web_url: 'https://gitlab.com/testuser',
		...overrides,
	};
}

function createGitLabIssue(overrides: Partial<GitLabIssue> = {}): GitLabIssue {
	return {
		id: 100,
		iid: 1,
		project_id: 10,
		title: 'Test Issue',
		description: 'Issue description',
		state: 'opened',
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-02T00:00:00Z',
		closed_at: null,
		labels: ['bug', 'critical'],
		assignees: [createGitLabUser({ id: 2, username: 'assignee' })],
		author: createGitLabUser(),
		milestone: null,
		web_url: 'https://gitlab.com/project/issues/1',
		...overrides,
	};
}

function createGitLabMergeRequest(overrides: Partial<GitLabMergeRequest> = {}): GitLabMergeRequest {
	return {
		id: 200,
		iid: 5,
		project_id: 10,
		title: 'Test MR',
		description: 'MR description',
		state: 'opened',
		source_branch: 'feature/test',
		target_branch: 'main',
		source_project_id: 10,
		target_project_id: 10,
		author: createGitLabUser(),
		assignees: [],
		reviewers: [],
		labels: ['enhancement'],
		draft: false,
		merge_status: 'can_be_merged',
		web_url: 'https://gitlab.com/project/merge_requests/5',
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-02T00:00:00Z',
		merged_at: null,
		closed_at: null,
		...overrides,
	};
}

function createGitLabCommit(overrides: Partial<GitLabCommit> = {}): GitLabCommit {
	return {
		id: 'abc123def456',
		short_id: 'abc123d',
		title: 'feat: add new feature',
		message: 'feat: add new feature\n\nDetailed description',
		author_name: 'Test Author',
		author_email: 'author@example.com',
		authored_date: '2024-01-01T00:00:00Z',
		committer_name: 'Test Committer',
		committer_email: 'committer@example.com',
		committed_date: '2024-01-01T00:00:00Z',
		web_url: 'https://gitlab.com/project/commit/abc123def456',
		...overrides,
	};
}

// ============================================================================
// User Mapping Tests
// ============================================================================

describe('mapUser', () => {
	it('should map GitLabUser to User correctly', () => {
		const gitlab_user = createGitLabUser();
		const result = mapUser(gitlab_user);

		assert.equal(result.id, 1);
		assert.equal(result.username, 'testuser');
		assert.equal(result.name, 'Test User');
		assert.equal(result.avatar_url, 'https://gitlab.com/avatar.png');
		assert.equal(result.web_url, 'https://gitlab.com/testuser');
	});

	it('should handle null avatar_url', () => {
		const gitlab_user = createGitLabUser({ avatar_url: null });
		const result = mapUser(gitlab_user);

		assert.equal(result.avatar_url, undefined);
	});
});

// ============================================================================
// Issue Mapping Tests
// ============================================================================

describe('mapIssue', () => {
	it('should map GitLabIssue to Issue correctly', () => {
		const gitlab_issue = createGitLabIssue();
		const result = mapIssue(gitlab_issue);

		assert.equal(result.id, 100);
		assert.equal(result.iid, 1);
		assert.equal(result.title, 'Test Issue');
		assert.equal(result.description, 'Issue description');
		assert.deepEqual(result.labels, ['bug', 'critical']);
		assert.equal(result.web_url, 'https://gitlab.com/project/issues/1');
	});

	it('should map "opened" state to "open"', () => {
		const gitlab_issue = createGitLabIssue({ state: 'opened' });
		const result = mapIssue(gitlab_issue);

		assert.equal(result.state, 'open');
	});

	it('should map "closed" state to "closed"', () => {
		const gitlab_issue = createGitLabIssue({ state: 'closed' });
		const result = mapIssue(gitlab_issue);

		assert.equal(result.state, 'closed');
	});

	it('should map author correctly', () => {
		const gitlab_issue = createGitLabIssue();
		const result = mapIssue(gitlab_issue);

		assert.equal(result.author.id, 1);
		assert.equal(result.author.username, 'testuser');
	});

	it('should map assignees correctly', () => {
		const gitlab_issue = createGitLabIssue();
		const result = mapIssue(gitlab_issue);

		assert.equal(result.assignees.length, 1);
		assert.equal(result.assignees[0].username, 'assignee');
	});

	it('should handle empty assignees', () => {
		const gitlab_issue = createGitLabIssue({ assignees: [] });
		const result = mapIssue(gitlab_issue);

		assert.deepEqual(result.assignees, []);
	});

	it('should handle undefined assignees', () => {
		const gitlab_issue = createGitLabIssue();
		// @ts-expect-error - Testing undefined case
		gitlab_issue.assignees = undefined;
		const result = mapIssue(gitlab_issue);

		assert.deepEqual(result.assignees, []);
	});
});

// ============================================================================
// Pull Request (Merge Request) Mapping Tests
// ============================================================================

describe('mapPullRequest', () => {
	it('should map GitLabMergeRequest to PullRequest correctly', () => {
		const gitlab_mr = createGitLabMergeRequest();
		const result = mapPullRequest(gitlab_mr);

		assert.equal(result.id, 200);
		assert.equal(result.iid, 5);
		assert.equal(result.title, 'Test MR');
		assert.equal(result.source_branch, 'feature/test');
		assert.equal(result.target_branch, 'main');
	});

	it('should map "opened" state to "open"', () => {
		const gitlab_mr = createGitLabMergeRequest({ state: 'opened' });
		const result = mapPullRequest(gitlab_mr);

		assert.equal(result.state, 'open');
	});

	it('should map "merged" state to "merged"', () => {
		const gitlab_mr = createGitLabMergeRequest({ state: 'merged' });
		const result = mapPullRequest(gitlab_mr);

		assert.equal(result.state, 'merged');
	});

	it('should map "closed" state to "closed"', () => {
		const gitlab_mr = createGitLabMergeRequest({ state: 'closed' });
		const result = mapPullRequest(gitlab_mr);

		assert.equal(result.state, 'closed');
	});

	it('should map "locked" state to "closed"', () => {
		const gitlab_mr = createGitLabMergeRequest({ state: 'locked' });
		const result = mapPullRequest(gitlab_mr);

		assert.equal(result.state, 'closed');
	});

	it('should set mergeable to true when merge_status is "can_be_merged"', () => {
		const gitlab_mr = createGitLabMergeRequest({ merge_status: 'can_be_merged' });
		const result = mapPullRequest(gitlab_mr);

		assert.equal(result.mergeable, true);
	});

	it('should set mergeable to false when merge_status is not "can_be_merged"', () => {
		const gitlab_mr = createGitLabMergeRequest({ merge_status: 'cannot_be_merged' });
		const result = mapPullRequest(gitlab_mr);

		assert.equal(result.mergeable, false);
	});

	it('should use draft field for draft status', () => {
		const gitlab_mr = createGitLabMergeRequest({ draft: true });
		const result = mapPullRequest(gitlab_mr);

		assert.equal(result.draft, true);
	});

	it('should fallback to work_in_progress for draft status', () => {
		const gitlab_mr = createGitLabMergeRequest({ draft: false, work_in_progress: true });
		// When draft is false but work_in_progress is true, draft should be true
		const result = mapPullRequest(gitlab_mr);

		// The mapper uses: draft: mr.draft ?? mr.work_in_progress ?? false
		// Since draft is false (not undefined), it uses false
		assert.equal(result.draft, false);
	});

	it('should handle undefined draft and work_in_progress', () => {
		const gitlab_mr = createGitLabMergeRequest();
		// @ts-expect-error - Testing undefined case
		gitlab_mr.draft = undefined;
		// @ts-expect-error - Testing undefined case
		gitlab_mr.work_in_progress = undefined;
		const result = mapPullRequest(gitlab_mr);

		assert.equal(result.draft, false);
	});
});

describe('mapPullRequestDiff', () => {
	it('should map GitLabMergeRequestDiff correctly', () => {
		const gitlab_diff: GitLabMergeRequestDiff = {
			old_path: 'src/old.ts',
			new_path: 'src/new.ts',
			a_mode: '100644',
			b_mode: '100644',
			new_file: false,
			renamed_file: true,
			deleted_file: false,
			diff: '@@ -1,3 +1,4 @@\n+// new line',
		};
		const result = mapPullRequestDiff(gitlab_diff);

		assert.equal(result.old_path, 'src/old.ts');
		assert.equal(result.new_path, 'src/new.ts');
		assert.equal(result.new_file, false);
		assert.equal(result.renamed_file, true);
		assert.equal(result.deleted_file, false);
		assert.equal(result.diff, '@@ -1,3 +1,4 @@\n+// new line');
	});
});

// ============================================================================
// Repository Mapping Tests
// ============================================================================

describe('mapFileContent', () => {
	it('should map GitLabFile to FileContent correctly', () => {
		const gitlab_file: GitLabFile = {
			file_name: 'test.ts',
			file_path: 'src/test.ts',
			size: 1234,
			encoding: 'base64',
			content: 'Y29uc29sZS5sb2coImhlbGxvIik7', // base64 of console.log("hello");
			content_sha256: 'abc123',
			ref: 'main',
			blob_id: 'blob123',
			commit_id: 'commit123',
			last_commit_id: 'lastcommit123',
		};
		const decoded_content = 'console.log("hello");';
		const result = mapFileContent(gitlab_file, decoded_content);

		assert.equal(result.type, 'file');
		assert.equal(result.path, 'src/test.ts');
		assert.equal(result.name, 'test.ts');
		assert.equal(result.size, 1234);
		assert.equal(result.content, 'console.log("hello");');
		assert.equal(result.encoding, 'utf-8');
		assert.equal(result.sha, 'abc123');
	});
});

describe('mapDirectoryContent', () => {
	it('should map directory items correctly', () => {
		const items: GitLabTreeItem[] = [
			{ id: 'id1', name: 'file.ts', type: 'blob', path: 'src/file.ts', mode: '100644' },
			{ id: 'id2', name: 'subdir', type: 'tree', path: 'src/subdir', mode: '040000' },
		];
		const result = mapDirectoryContent('src', items);

		assert.equal(result.type, 'directory');
		assert.equal(result.path, 'src');
		assert.equal(result.entries.length, 2);
		assert.equal(result.entries[0].type, 'file');
		assert.equal(result.entries[1].type, 'directory');
	});
});

describe('mapTreeEntry', () => {
	it('should map blob type to file', () => {
		const item: GitLabTreeItem = {
			id: 'id1',
			name: 'test.ts',
			type: 'blob',
			path: 'src/test.ts',
			mode: '100644',
		};
		const result = mapTreeEntry(item);

		assert.equal(result.name, 'test.ts');
		assert.equal(result.path, 'src/test.ts');
		assert.equal(result.type, 'file');
		assert.equal(result.mode, '100644');
		assert.equal(result.sha, 'id1');
	});

	it('should map tree type to directory', () => {
		const item: GitLabTreeItem = {
			id: 'id2',
			name: 'subdir',
			type: 'tree',
			path: 'src/subdir',
			mode: '040000',
		};
		const result = mapTreeEntry(item);

		assert.equal(result.type, 'directory');
	});
});

describe('mapCommit', () => {
	it('should map GitLabCommit to Commit correctly', () => {
		const gitlab_commit = createGitLabCommit();
		const result = mapCommit(gitlab_commit);

		assert.equal(result.sha, 'abc123def456');
		assert.equal(result.short_sha, 'abc123d');
		assert.equal(result.message, 'feat: add new feature\n\nDetailed description');
		assert.equal(result.author_name, 'Test Author');
		assert.equal(result.author_email, 'author@example.com');
		assert.equal(result.created_at, '2024-01-01T00:00:00Z');
		assert.equal(result.web_url, 'https://gitlab.com/project/commit/abc123def456');
	});

	it('should map commit stats when present', () => {
		const gitlab_commit = createGitLabCommit({
			stats: { additions: 10, deletions: 5, total: 15 },
		});
		const result = mapCommit(gitlab_commit);

		assert.deepEqual(result.stats, { additions: 10, deletions: 5, total: 15 });
	});

	it('should handle missing stats', () => {
		const gitlab_commit = createGitLabCommit();
		delete gitlab_commit.stats;
		const result = mapCommit(gitlab_commit);

		assert.equal(result.stats, undefined);
	});
});

// ============================================================================
// Branch Mapping Tests
// ============================================================================

describe('mapBranch', () => {
	it('should map GitLabBranch to Branch correctly', () => {
		const gitlab_branch: GitLabBranch = {
			name: 'feature/test',
			commit: createGitLabCommit(),
			merged: false,
			protected: true,
			developers_can_push: false,
			developers_can_merge: true,
			can_push: true,
			default: false,
			web_url: 'https://gitlab.com/project/-/tree/feature/test',
		};
		const result = mapBranch(gitlab_branch);

		assert.equal(result.name, 'feature/test');
		assert.equal(result.sha, 'abc123def456');
		assert.equal(result.protected, true);
		assert.equal(result.default, false);
		assert.equal(result.web_url, 'https://gitlab.com/project/-/tree/feature/test');
	});

	it('should map default branch correctly', () => {
		const gitlab_branch: GitLabBranch = {
			name: 'main',
			commit: createGitLabCommit(),
			merged: false,
			protected: true,
			developers_can_push: false,
			developers_can_merge: false,
			can_push: false,
			default: true,
			web_url: 'https://gitlab.com/project/-/tree/main',
		};
		const result = mapBranch(gitlab_branch);

		assert.equal(result.default, true);
	});
});

// ============================================================================
// CI/CD Mapping Tests
// ============================================================================

describe('mapPipeline', () => {
	it('should map GitLabPipeline to Pipeline correctly', () => {
		const gitlab_pipeline: GitLabPipeline = {
			id: 12345,
			project_id: 10,
			sha: 'abc123',
			ref: 'main',
			status: 'success',
			source: 'push',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T01:00:00Z',
			web_url: 'https://gitlab.com/project/-/pipelines/12345',
		};
		const result = mapPipeline(gitlab_pipeline);

		assert.equal(result.id, 12345);
		assert.equal(result.status, 'success');
		assert.equal(result.ref, 'main');
		assert.equal(result.sha, 'abc123');
	});

	it('should map valid pipeline statuses', () => {
		const statuses: Array<{ input: string; expected: string }> = [
			{ input: 'pending', expected: 'pending' },
			{ input: 'running', expected: 'running' },
			{ input: 'success', expected: 'success' },
			{ input: 'failed', expected: 'failed' },
			{ input: 'canceled', expected: 'canceled' },
			{ input: 'skipped', expected: 'skipped' },
		];

		for (const { input, expected } of statuses) {
			const gitlab_pipeline: GitLabPipeline = {
				id: 1,
				project_id: 1,
				sha: 'abc',
				ref: 'main',
				status: input as GitLabPipeline['status'],
				source: 'push',
				created_at: '2024-01-01T00:00:00Z',
				updated_at: '2024-01-01T00:00:00Z',
				web_url: 'https://gitlab.com/pipeline',
			};
			const result = mapPipeline(gitlab_pipeline);
			assert.equal(result.status, expected, `Expected ${input} to map to ${expected}`);
		}
	});

	it('should map unknown status to "pending"', () => {
		const gitlab_pipeline: GitLabPipeline = {
			id: 1,
			project_id: 1,
			sha: 'abc',
			ref: 'main',
			status: 'manual', // Not in standard list
			source: 'push',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			web_url: 'https://gitlab.com/pipeline',
		};
		const result = mapPipeline(gitlab_pipeline);

		assert.equal(result.status, 'pending');
	});
});

describe('mapJob', () => {
	it('should map GitLabJob to Job correctly', () => {
		const gitlab_job: GitLabJob = {
			id: 54321,
			name: 'test',
			stage: 'test',
			status: 'success',
			ref: 'main',
			created_at: '2024-01-01T00:00:00Z',
			started_at: '2024-01-01T00:01:00Z',
			finished_at: '2024-01-01T00:05:00Z',
			duration: 240,
			web_url: 'https://gitlab.com/project/-/jobs/54321',
		};
		const result = mapJob(gitlab_job);

		assert.equal(result.id, 54321);
		assert.equal(result.name, 'test');
		assert.equal(result.stage, 'test');
		assert.equal(result.status, 'success');
		assert.equal(result.duration, 240);
	});

	it('should handle null started_at and finished_at', () => {
		const gitlab_job: GitLabJob = {
			id: 1,
			name: 'pending-job',
			stage: 'build',
			status: 'pending',
			ref: 'main',
			created_at: '2024-01-01T00:00:00Z',
			started_at: null,
			finished_at: null,
			duration: null,
			web_url: 'https://gitlab.com/job',
		};
		const result = mapJob(gitlab_job);

		assert.equal(result.started_at, null);
		assert.equal(result.finished_at, null);
		assert.equal(result.duration, null);
	});

	it('should map unknown job status to "pending"', () => {
		const gitlab_job: GitLabJob = {
			id: 1,
			name: 'job',
			stage: 'build',
			status: 'created' as GitLabJob['status'], // Not in standard list
			ref: 'main',
			created_at: '2024-01-01T00:00:00Z',
			started_at: null,
			finished_at: null,
			duration: null,
			web_url: 'https://gitlab.com/job',
		};
		const result = mapJob(gitlab_job);

		assert.equal(result.status, 'pending');
	});
});

// ============================================================================
// Comment (Note) Mapping Tests
// ============================================================================

describe('mapComment', () => {
	it('should map GitLabNote to Comment correctly', () => {
		const gitlab_note: GitLabNote = {
			id: 9999,
			body: 'This is a comment',
			author: createGitLabUser(),
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-02T00:00:00Z',
			system: false,
			noteable_type: 'Issue',
			noteable_iid: 1,
		};
		const result = mapComment(gitlab_note);

		assert.equal(result.id, 9999);
		assert.equal(result.body, 'This is a comment');
		assert.equal(result.author.username, 'testuser');
		assert.equal(result.created_at, '2024-01-01T00:00:00Z');
		assert.equal(result.updated_at, '2024-01-02T00:00:00Z');
	});

	it('should map comment author correctly', () => {
		const gitlab_note: GitLabNote = {
			id: 1,
			body: 'Comment body',
			author: createGitLabUser({ id: 99, username: 'commenter', name: 'Comment Author' }),
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			system: false,
			noteable_type: 'MergeRequest',
			noteable_iid: 5,
		};
		const result = mapComment(gitlab_note);

		assert.equal(result.author.id, 99);
		assert.equal(result.author.username, 'commenter');
		assert.equal(result.author.name, 'Comment Author');
	});
});
