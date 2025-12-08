/**
 * GitHub Mapper Tests - Unit tests for type mapping functions
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
	GitHubUser,
	GitHubIssue,
	GitHubPullRequest,
	GitHubPullRequestFile,
	GitHubContent,
	GitHubTreeItem,
	GitHubCommit,
	GitHubBranch,
	GitHubWorkflowRun,
	GitHubWorkflowJob,
	GitHubIssueComment,
	GitHubLabel,
} from '../../github/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function createGitHubUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
	return {
		id: 1,
		login: 'testuser',
		name: 'Test User',
		avatar_url: 'https://github.com/avatar.png',
		html_url: 'https://github.com/testuser',
		type: 'User',
		...overrides,
	};
}

function createGitHubLabel(overrides: Partial<GitHubLabel> = {}): GitHubLabel {
	return {
		id: 1,
		name: 'bug',
		color: 'ff0000',
		description: 'Bug label',
		...overrides,
	};
}

function createGitHubIssue(overrides: Partial<GitHubIssue> = {}): GitHubIssue {
	return {
		id: 100,
		number: 1,
		title: 'Test Issue',
		body: 'Issue description',
		state: 'open',
		state_reason: null,
		user: createGitHubUser(),
		assignees: [],
		labels: [createGitHubLabel()],
		milestone: null,
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-02T00:00:00Z',
		closed_at: null,
		html_url: 'https://github.com/owner/repo/issues/1',
		...overrides,
	};
}

function createGitHubPullRequest(overrides: Partial<GitHubPullRequest> = {}): GitHubPullRequest {
	return {
		id: 200,
		number: 5,
		title: 'Test PR',
		body: 'PR description',
		state: 'open',
		draft: false,
		user: createGitHubUser(),
		assignees: [],
		requested_reviewers: [],
		labels: [],
		head: {
			ref: 'feature/test',
			sha: 'abc123',
			repo: { full_name: 'owner/repo' },
		},
		base: {
			ref: 'main',
			sha: 'def456',
			repo: { full_name: 'owner/repo' },
		},
		merged: false,
		mergeable: true,
		mergeable_state: 'clean',
		merged_at: null,
		merged_by: null,
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-02T00:00:00Z',
		closed_at: null,
		html_url: 'https://github.com/owner/repo/pull/5',
		...overrides,
	};
}

function createGitHubCommit(overrides: Partial<GitHubCommit> = {}): GitHubCommit {
	return {
		sha: 'abc123def456789',
		html_url: 'https://github.com/owner/repo/commit/abc123',
		commit: {
			message: 'feat: add new feature',
			author: {
				name: 'Test Author',
				email: 'author@example.com',
				date: '2024-01-01T00:00:00Z',
			},
			committer: {
				name: 'Test Committer',
				email: 'committer@example.com',
				date: '2024-01-01T00:00:00Z',
			},
		},
		author: createGitHubUser(),
		committer: createGitHubUser(),
		...overrides,
	};
}

// ============================================================================
// User Mapping Tests
// ============================================================================

describe('GitHub mapUser', () => {
	it('should map GitHubUser to User correctly', () => {
		const github_user = createGitHubUser();
		const result = mapUser(github_user);

		assert.equal(result.id, 1);
		assert.equal(result.username, 'testuser');
		assert.equal(result.name, 'Test User');
		assert.equal(result.avatar_url, 'https://github.com/avatar.png');
		assert.equal(result.web_url, 'https://github.com/testuser');
	});

	it('should use login as name when name is null', () => {
		const github_user = createGitHubUser({ name: null });
		const result = mapUser(github_user);

		assert.equal(result.name, 'testuser');
	});
});

// ============================================================================
// Issue Mapping Tests
// ============================================================================

describe('GitHub mapIssue', () => {
	it('should map GitHubIssue to Issue correctly', () => {
		const github_issue = createGitHubIssue();
		const result = mapIssue(github_issue);

		assert.equal(result.id, 100);
		assert.equal(result.iid, 1);
		assert.equal(result.title, 'Test Issue');
		assert.equal(result.description, 'Issue description');
		assert.equal(result.state, 'open');
		assert.deepEqual(result.labels, ['bug']);
	});

	it('should map "open" state correctly', () => {
		const github_issue = createGitHubIssue({ state: 'open' });
		const result = mapIssue(github_issue);

		assert.equal(result.state, 'open');
	});

	it('should map "closed" state correctly', () => {
		const github_issue = createGitHubIssue({ state: 'closed' });
		const result = mapIssue(github_issue);

		assert.equal(result.state, 'closed');
	});

	it('should map assignees correctly', () => {
		const github_issue = createGitHubIssue({
			assignees: [
				createGitHubUser({ id: 2, login: 'assignee1' }),
				createGitHubUser({ id: 3, login: 'assignee2' }),
			],
		});
		const result = mapIssue(github_issue);

		assert.equal(result.assignees.length, 2);
		assert.equal(result.assignees[0].username, 'assignee1');
		assert.equal(result.assignees[1].username, 'assignee2');
	});

	it('should map labels correctly', () => {
		const github_issue = createGitHubIssue({
			labels: [
				createGitHubLabel({ name: 'bug' }),
				createGitHubLabel({ name: 'critical' }),
			],
		});
		const result = mapIssue(github_issue);

		assert.deepEqual(result.labels, ['bug', 'critical']);
	});

	it('should handle null body', () => {
		const github_issue = createGitHubIssue({ body: null });
		const result = mapIssue(github_issue);

		assert.equal(result.description, null);
	});
});

// ============================================================================
// Pull Request Mapping Tests
// ============================================================================

describe('GitHub mapPullRequest', () => {
	it('should map GitHubPullRequest to PullRequest correctly', () => {
		const github_pr = createGitHubPullRequest();
		const result = mapPullRequest(github_pr);

		assert.equal(result.id, 200);
		assert.equal(result.iid, 5);
		assert.equal(result.title, 'Test PR');
		assert.equal(result.source_branch, 'feature/test');
		assert.equal(result.target_branch, 'main');
	});

	it('should map "open" state to "open"', () => {
		const github_pr = createGitHubPullRequest({ state: 'open', merged: false });
		const result = mapPullRequest(github_pr);

		assert.equal(result.state, 'open');
	});

	it('should map "closed" state to "closed" when not merged', () => {
		const github_pr = createGitHubPullRequest({ state: 'closed', merged: false });
		const result = mapPullRequest(github_pr);

		assert.equal(result.state, 'closed');
	});

	it('should map to "merged" when merged is true', () => {
		const github_pr = createGitHubPullRequest({
			state: 'closed',
			merged: true,
			merged_at: '2024-01-15T12:00:00Z',
		});
		const result = mapPullRequest(github_pr);

		assert.equal(result.state, 'merged');
		assert.equal(result.merged_at, '2024-01-15T12:00:00Z');
	});

	it('should map to "merged" when merged_at is present', () => {
		const github_pr = createGitHubPullRequest({
			state: 'closed',
			merged: false,
			merged_at: '2024-01-15T12:00:00Z',
		});
		const result = mapPullRequest(github_pr);

		assert.equal(result.state, 'merged');
	});

	it('should map draft status correctly', () => {
		const github_pr = createGitHubPullRequest({ draft: true });
		const result = mapPullRequest(github_pr);

		assert.equal(result.draft, true);
	});

	it('should map mergeable status correctly', () => {
		const github_pr = createGitHubPullRequest({ mergeable: true });
		const result = mapPullRequest(github_pr);

		assert.equal(result.mergeable, true);
	});

	it('should handle null mergeable', () => {
		const github_pr = createGitHubPullRequest({ mergeable: null });
		const result = mapPullRequest(github_pr);

		assert.equal(result.mergeable, false);
	});

	it('should map reviewers correctly', () => {
		const github_pr = createGitHubPullRequest({
			requested_reviewers: [
				createGitHubUser({ id: 10, login: 'reviewer1' }),
			],
		});
		const result = mapPullRequest(github_pr);

		assert.equal(result.reviewers.length, 1);
		assert.equal(result.reviewers[0].username, 'reviewer1');
	});
});

describe('GitHub mapPullRequestDiff', () => {
	it('should map added file correctly', () => {
		const file: GitHubPullRequestFile = {
			sha: 'abc123',
			filename: 'src/new.ts',
			status: 'added',
			additions: 10,
			deletions: 0,
			changes: 10,
			patch: '+// new content',
		};
		const result = mapPullRequestDiff(file);

		assert.equal(result.old_path, 'src/new.ts');
		assert.equal(result.new_path, 'src/new.ts');
		assert.equal(result.new_file, true);
		assert.equal(result.deleted_file, false);
		assert.equal(result.renamed_file, false);
	});

	it('should map renamed file correctly', () => {
		const file: GitHubPullRequestFile = {
			sha: 'abc123',
			filename: 'src/renamed.ts',
			status: 'renamed',
			additions: 0,
			deletions: 0,
			changes: 0,
			previous_filename: 'src/original.ts',
		};
		const result = mapPullRequestDiff(file);

		assert.equal(result.old_path, 'src/original.ts');
		assert.equal(result.new_path, 'src/renamed.ts');
		assert.equal(result.renamed_file, true);
	});

	it('should map removed file correctly', () => {
		const file: GitHubPullRequestFile = {
			sha: 'abc123',
			filename: 'src/deleted.ts',
			status: 'removed',
			additions: 0,
			deletions: 50,
			changes: 50,
		};
		const result = mapPullRequestDiff(file);

		assert.equal(result.deleted_file, true);
		assert.equal(result.new_file, false);
	});

	it('should handle missing patch', () => {
		const file: GitHubPullRequestFile = {
			sha: 'abc123',
			filename: 'binary.png',
			status: 'modified',
			additions: 0,
			deletions: 0,
			changes: 0,
		};
		const result = mapPullRequestDiff(file);

		assert.equal(result.diff, '');
	});
});

// ============================================================================
// Repository Mapping Tests
// ============================================================================

describe('GitHub mapFileContent', () => {
	it('should map GitHubContent to FileContent correctly', () => {
		const content: GitHubContent = {
			type: 'file',
			name: 'test.ts',
			path: 'src/test.ts',
			sha: 'abc123',
			size: 100,
			html_url: 'https://github.com/owner/repo/blob/main/src/test.ts',
			content: 'Y29uc29sZS5sb2coImhlbGxvIik7',
			encoding: 'base64',
		};
		const decoded = 'console.log("hello");';
		const result = mapFileContent(content, decoded);

		assert.equal(result.type, 'file');
		assert.equal(result.path, 'src/test.ts');
		assert.equal(result.name, 'test.ts');
		assert.equal(result.size, 100);
		assert.equal(result.content, decoded);
		assert.equal(result.encoding, 'utf-8');
		assert.equal(result.sha, 'abc123');
	});
});

describe('GitHub mapDirectoryContent', () => {
	it('should map directory items correctly', () => {
		const items: GitHubContent[] = [
			{ type: 'file', name: 'index.ts', path: 'src/index.ts', sha: 'a', size: 50, html_url: '' },
			{ type: 'dir', name: 'utils', path: 'src/utils', sha: 'b', size: 0, html_url: '' },
		];
		const result = mapDirectoryContent('src', items);

		assert.equal(result.type, 'directory');
		assert.equal(result.path, 'src');
		assert.equal(result.entries.length, 2);
		assert.equal(result.entries[0].type, 'file');
		assert.equal(result.entries[1].type, 'directory');
	});
});

describe('GitHub mapTreeEntry', () => {
	it('should map blob type to file', () => {
		const item: GitHubTreeItem = {
			path: 'src/test.ts',
			mode: '100644',
			type: 'blob',
			sha: 'abc123',
			size: 100,
			url: 'https://api.github.com/repos/owner/repo/git/blobs/abc123',
		};
		const result = mapTreeEntry(item);

		assert.equal(result.name, 'test.ts');
		assert.equal(result.path, 'src/test.ts');
		assert.equal(result.type, 'file');
		assert.equal(result.mode, '100644');
		assert.equal(result.sha, 'abc123');
	});

	it('should map tree type to directory', () => {
		const item: GitHubTreeItem = {
			path: 'src/utils',
			mode: '040000',
			type: 'tree',
			sha: 'def456',
			url: 'https://api.github.com/repos/owner/repo/git/trees/def456',
		};
		const result = mapTreeEntry(item);

		assert.equal(result.type, 'directory');
	});

	it('should extract name from path', () => {
		const item: GitHubTreeItem = {
			path: 'very/deep/nested/file.ts',
			mode: '100644',
			type: 'blob',
			sha: 'abc',
			url: '',
		};
		const result = mapTreeEntry(item);

		assert.equal(result.name, 'file.ts');
	});
});

describe('GitHub mapCommit', () => {
	it('should map GitHubCommit to Commit correctly', () => {
		const github_commit = createGitHubCommit();
		const result = mapCommit(github_commit);

		assert.equal(result.sha, 'abc123def456789');
		assert.equal(result.short_sha, 'abc123d');
		assert.equal(result.message, 'feat: add new feature');
		assert.equal(result.author_name, 'Test Author');
		assert.equal(result.author_email, 'author@example.com');
	});

	it('should map commit stats when present', () => {
		const github_commit = createGitHubCommit({
			stats: { additions: 10, deletions: 5, total: 15 },
		});
		const result = mapCommit(github_commit);

		assert.deepEqual(result.stats, { additions: 10, deletions: 5, total: 15 });
	});
});

// ============================================================================
// Branch Mapping Tests
// ============================================================================

describe('GitHub mapBranch', () => {
	it('should map GitHubBranch to Branch correctly', () => {
		const github_branch: GitHubBranch = {
			name: 'feature/test',
			commit: { sha: 'abc123', url: '' },
			protected: true,
		};
		const result = mapBranch(github_branch, false);

		assert.equal(result.name, 'feature/test');
		assert.equal(result.sha, 'abc123');
		assert.equal(result.protected, true);
		assert.equal(result.default, false);
	});

	it('should mark default branch correctly', () => {
		const github_branch: GitHubBranch = {
			name: 'main',
			commit: { sha: 'def456', url: '' },
			protected: true,
		};
		const result = mapBranch(github_branch, true);

		assert.equal(result.default, true);
	});
});

// ============================================================================
// CI/CD Mapping Tests (GitHub Actions)
// ============================================================================

describe('GitHub mapPipeline', () => {
	it('should map successful workflow run correctly', () => {
		const run: GitHubWorkflowRun = {
			id: 12345,
			name: 'CI',
			head_branch: 'main',
			head_sha: 'abc123',
			status: 'completed',
			conclusion: 'success',
			workflow_id: 1,
			html_url: 'https://github.com/owner/repo/actions/runs/12345',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T01:00:00Z',
			run_started_at: '2024-01-01T00:00:00Z',
		};
		const result = mapPipeline(run);

		assert.equal(result.id, 12345);
		assert.equal(result.status, 'success');
		assert.equal(result.ref, 'main');
		assert.equal(result.sha, 'abc123');
	});

	it('should map failed workflow run correctly', () => {
		const run: GitHubWorkflowRun = {
			id: 1,
			name: 'CI',
			head_branch: 'main',
			head_sha: 'abc',
			status: 'completed',
			conclusion: 'failure',
			workflow_id: 1,
			html_url: '',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			run_started_at: null,
		};
		const result = mapPipeline(run);

		assert.equal(result.status, 'failed');
	});

	it('should map cancelled workflow run correctly', () => {
		const run: GitHubWorkflowRun = {
			id: 1,
			name: 'CI',
			head_branch: 'main',
			head_sha: 'abc',
			status: 'completed',
			conclusion: 'cancelled',
			workflow_id: 1,
			html_url: '',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			run_started_at: null,
		};
		const result = mapPipeline(run);

		assert.equal(result.status, 'canceled');
	});

	it('should map in_progress status to running', () => {
		const run: GitHubWorkflowRun = {
			id: 1,
			name: 'CI',
			head_branch: 'main',
			head_sha: 'abc',
			status: 'in_progress',
			conclusion: null,
			workflow_id: 1,
			html_url: '',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			run_started_at: null,
		};
		const result = mapPipeline(run);

		assert.equal(result.status, 'running');
	});

	it('should map queued status to pending', () => {
		const run: GitHubWorkflowRun = {
			id: 1,
			name: 'CI',
			head_branch: 'main',
			head_sha: 'abc',
			status: 'queued',
			conclusion: null,
			workflow_id: 1,
			html_url: '',
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-01T00:00:00Z',
			run_started_at: null,
		};
		const result = mapPipeline(run);

		assert.equal(result.status, 'pending');
	});
});

describe('GitHub mapJob', () => {
	it('should map successful job correctly', () => {
		const job: GitHubWorkflowJob = {
			id: 54321,
			run_id: 12345,
			name: 'build',
			status: 'completed',
			conclusion: 'success',
			started_at: '2024-01-01T00:00:00Z',
			completed_at: '2024-01-01T00:05:00Z',
			html_url: 'https://github.com/owner/repo/actions/runs/12345/jobs/54321',
		};
		const result = mapJob(job);

		assert.equal(result.id, 54321);
		assert.equal(result.name, 'build');
		assert.equal(result.status, 'success');
		assert.equal(result.duration, 300); // 5 minutes
	});

	it('should map failed job correctly', () => {
		const job: GitHubWorkflowJob = {
			id: 1,
			run_id: 1,
			name: 'test',
			status: 'completed',
			conclusion: 'failure',
			started_at: '2024-01-01T00:00:00Z',
			completed_at: '2024-01-01T00:01:00Z',
			html_url: '',
		};
		const result = mapJob(job);

		assert.equal(result.status, 'failed');
	});

	it('should handle null started_at', () => {
		const job: GitHubWorkflowJob = {
			id: 1,
			run_id: 1,
			name: 'pending-job',
			status: 'queued',
			conclusion: null,
			started_at: null,
			completed_at: null,
			html_url: '',
		};
		const result = mapJob(job);

		assert.equal(result.started_at, null);
		assert.equal(result.duration, null);
	});
});

// ============================================================================
// Comment Mapping Tests
// ============================================================================

describe('GitHub mapComment', () => {
	it('should map GitHubIssueComment to Comment correctly', () => {
		const comment: GitHubIssueComment = {
			id: 9999,
			body: 'This is a comment',
			user: createGitHubUser(),
			created_at: '2024-01-01T00:00:00Z',
			updated_at: '2024-01-02T00:00:00Z',
			html_url: 'https://github.com/owner/repo/issues/1#issuecomment-9999',
		};
		const result = mapComment(comment);

		assert.equal(result.id, 9999);
		assert.equal(result.body, 'This is a comment');
		assert.equal(result.author.username, 'testuser');
		assert.equal(result.created_at, '2024-01-01T00:00:00Z');
		assert.equal(result.updated_at, '2024-01-02T00:00:00Z');
	});
});
