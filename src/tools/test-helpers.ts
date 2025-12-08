/**
 * Test Helpers - Mock factories and utilities for tool testing
 */

import type { GitProvider, IssueProvider, PullRequestProvider, RepositoryProvider, CIProvider, UserProvider } from '../providers/interface.js';
import type { ToolContext } from './types.js';
import type { Logger } from '../lib/logger.js';
import type {
	Issue,
	PullRequest,
	User,
	Comment,
	FileContent,
	DirectoryContent,
	TreeEntry,
	Commit,
	Branch,
	Pipeline,
	Job,
	PullRequestDiff,
	SearchCodeResult,
} from '../providers/types.js';

// ============================================================================
// Mock Logger
// ============================================================================

export function createMockLogger(): Logger {
	return {
		debug: () => {},
		info: () => {},
		warn: () => {},
		error: () => {},
		child: () => createMockLogger(),
	} as Logger;
}

// ============================================================================
// Mock User Factory
// ============================================================================

export function createMockUser(overrides: Partial<User> = {}): User {
	return {
		id: 1,
		username: 'testuser',
		name: 'Test User',
		avatar_url: 'https://example.com/avatar.png',
		web_url: 'https://example.com/testuser',
		...overrides,
	};
}

// ============================================================================
// Mock Issue Factory
// ============================================================================

export function createMockIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 100,
		iid: 1,
		title: 'Test Issue',
		description: 'Issue description',
		state: 'open',
		author: createMockUser(),
		assignees: [],
		labels: [],
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-02T00:00:00Z',
		closed_at: null,
		web_url: 'https://example.com/issues/1',
		...overrides,
	};
}

// ============================================================================
// Mock Pull Request Factory
// ============================================================================

export function createMockPullRequest(overrides: Partial<PullRequest> = {}): PullRequest {
	return {
		id: 200,
		iid: 5,
		title: 'Test PR',
		description: 'PR description',
		state: 'open',
		source_branch: 'feature/test',
		target_branch: 'main',
		author: createMockUser(),
		assignees: [],
		reviewers: [],
		labels: [],
		draft: false,
		mergeable: true,
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-02T00:00:00Z',
		merged_at: null,
		web_url: 'https://example.com/mr/5',
		...overrides,
	};
}

// ============================================================================
// Mock Comment Factory
// ============================================================================

export function createMockComment(overrides: Partial<Comment> = {}): Comment {
	return {
		id: 999,
		body: 'Test comment',
		author: createMockUser(),
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		...overrides,
	};
}

// ============================================================================
// Mock Repository Types
// ============================================================================

export function createMockFileContent(overrides: Partial<FileContent> = {}): FileContent {
	return {
		type: 'file',
		path: 'src/test.ts',
		name: 'test.ts',
		size: 100,
		content: 'console.log("hello");',
		encoding: 'utf-8',
		sha: 'abc123',
		...overrides,
	};
}

export function createMockDirectoryContent(overrides: Partial<DirectoryContent> = {}): DirectoryContent {
	return {
		type: 'directory',
		path: 'src',
		entries: [
			{ name: 'index.ts', path: 'src/index.ts', type: 'file', mode: '100644' },
			{ name: 'utils', path: 'src/utils', type: 'directory', mode: '040000' },
		],
		...overrides,
	};
}

export function createMockTreeEntry(overrides: Partial<TreeEntry> = {}): TreeEntry {
	return {
		name: 'test.ts',
		path: 'src/test.ts',
		type: 'file',
		mode: '100644',
		sha: 'abc123',
		...overrides,
	};
}

export function createMockCommit(overrides: Partial<Commit> = {}): Commit {
	return {
		sha: 'abc123def456',
		short_sha: 'abc123d',
		message: 'feat: add feature',
		author_name: 'Test Author',
		author_email: 'author@example.com',
		created_at: '2024-01-01T00:00:00Z',
		web_url: 'https://example.com/commit/abc123',
		...overrides,
	};
}

export function createMockBranch(overrides: Partial<Branch> = {}): Branch {
	return {
		name: 'main',
		sha: 'abc123',
		protected: false,
		default: true,
		web_url: 'https://example.com/tree/main',
		...overrides,
	};
}

// ============================================================================
// Mock CI/CD Types
// ============================================================================

export function createMockPipeline(overrides: Partial<Pipeline> = {}): Pipeline {
	return {
		id: 12345,
		status: 'success',
		ref: 'main',
		sha: 'abc123',
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T01:00:00Z',
		web_url: 'https://example.com/pipelines/12345',
		...overrides,
	};
}

export function createMockJob(overrides: Partial<Job> = {}): Job {
	return {
		id: 54321,
		name: 'test',
		status: 'success',
		stage: 'test',
		created_at: '2024-01-01T00:00:00Z',
		started_at: '2024-01-01T00:01:00Z',
		finished_at: '2024-01-01T00:05:00Z',
		duration: 240,
		web_url: 'https://example.com/jobs/54321',
		...overrides,
	};
}

// ============================================================================
// Mock Provider Factories
// ============================================================================

export interface MockIssueProviderOptions {
	get?: (repo: string, issue_number: number) => Promise<Issue>;
	list?: (repo: string, params?: unknown) => Promise<Issue[]>;
	create?: (repo: string, params: unknown) => Promise<Issue>;
	update?: (repo: string, issue_number: number, params: unknown) => Promise<Issue>;
	createComment?: (repo: string, issue_number: number, params: unknown) => Promise<Comment>;
	listComments?: (repo: string, issue_number: number, params?: unknown) => Promise<Comment[]>;
}

export function createMockIssueProvider(options: MockIssueProviderOptions = {}): IssueProvider {
	return {
		get: options.get ?? (async () => createMockIssue()),
		list: options.list ?? (async () => [createMockIssue()]),
		create: options.create ?? (async () => createMockIssue()),
		update: options.update ?? (async () => createMockIssue()),
		createComment: options.createComment ?? (async () => createMockComment()),
		listComments: options.listComments ?? (async () => [createMockComment()]),
	};
}

export interface MockPullRequestProviderOptions {
	get?: (repo: string, pr_number: number) => Promise<PullRequest>;
	list?: (repo: string, params?: unknown) => Promise<PullRequest[]>;
	create?: (repo: string, params: unknown) => Promise<PullRequest>;
	getDiffs?: (repo: string, pr_number: number) => Promise<PullRequestDiff[]>;
	merge?: (repo: string, pr_number: number, params?: unknown) => Promise<PullRequest>;
	createComment?: (repo: string, pr_number: number, params: unknown) => Promise<Comment>;
	listComments?: (repo: string, pr_number: number, params?: unknown) => Promise<Comment[]>;
}

export function createMockPullRequestProvider(options: MockPullRequestProviderOptions = {}): PullRequestProvider {
	return {
		get: options.get ?? (async () => createMockPullRequest()),
		list: options.list ?? (async () => [createMockPullRequest()]),
		create: options.create ?? (async () => createMockPullRequest()),
		getDiffs: options.getDiffs ?? (async () => []),
		merge: options.merge ?? (async () => createMockPullRequest({ state: 'merged' })),
		createComment: options.createComment ?? (async () => createMockComment()),
		listComments: options.listComments ?? (async () => [createMockComment()]),
	};
}

export interface MockRepositoryProviderOptions {
	getContent?: (repo: string, path: string, ref?: string) => Promise<FileContent | DirectoryContent>;
	getTree?: (repo: string, params?: unknown) => Promise<TreeEntry[]>;
	commit?: (repo: string, params: unknown) => Promise<Commit>;
	listCommits?: (repo: string, params?: unknown) => Promise<Commit[]>;
	createBranch?: (repo: string, params: unknown) => Promise<Branch>;
	listBranches?: (repo: string, params?: unknown) => Promise<Branch[]>;
	searchCode?: (repo: string, params: unknown) => Promise<SearchCodeResult[]>;
}

export function createMockRepositoryProvider(options: MockRepositoryProviderOptions = {}): RepositoryProvider {
	return {
		getContent: options.getContent ?? (async () => createMockFileContent()),
		getTree: options.getTree ?? (async () => [createMockTreeEntry()]),
		commit: options.commit ?? (async () => createMockCommit()),
		listCommits: options.listCommits ?? (async () => [createMockCommit()]),
		createBranch: options.createBranch ?? (async () => createMockBranch()),
		listBranches: options.listBranches ?? (async () => [createMockBranch()]),
		searchCode: options.searchCode ?? (async () => []),
	};
}

export interface MockCIProviderOptions {
	getPipeline?: (repo: string, pipeline_id: number) => Promise<Pipeline>;
	listPipelines?: (repo: string, params?: unknown) => Promise<Pipeline[]>;
	listJobs?: (repo: string, pipeline_id: number, params?: unknown) => Promise<Job[]>;
	getJobLog?: (repo: string, job_id: number) => Promise<string>;
}

export function createMockCIProvider(options: MockCIProviderOptions = {}): CIProvider {
	return {
		getPipeline: options.getPipeline ?? (async () => createMockPipeline()),
		listPipelines: options.listPipelines ?? (async () => [createMockPipeline()]),
		listJobs: options.listJobs ?? (async () => [createMockJob()]),
		getJobLog: options.getJobLog ?? (async () => 'Job log output'),
	};
}

export interface MockUserProviderOptions {
	getMe?: () => Promise<User>;
}

export function createMockUserProvider(options: MockUserProviderOptions = {}): UserProvider {
	return {
		getMe: options.getMe ?? (async () => createMockUser()),
	};
}

// ============================================================================
// Mock GitProvider Factory
// ============================================================================

export interface MockGitProviderOptions {
	issues?: MockIssueProviderOptions;
	pullRequests?: MockPullRequestProviderOptions;
	repository?: MockRepositoryProviderOptions;
	ci?: MockCIProviderOptions;
	users?: MockUserProviderOptions;
}

export function createMockGitProvider(options: MockGitProviderOptions = {}): GitProvider {
	return {
		info: {
			type: 'gitlab',
			name: 'Mock GitLab',
			version: '1.0.0',
			base_url: 'https://gitlab.example.com',
		},
		issues: createMockIssueProvider(options.issues),
		pullRequests: createMockPullRequestProvider(options.pullRequests),
		repository: createMockRepositoryProvider(options.repository),
		ci: createMockCIProvider(options.ci),
		users: createMockUserProvider(options.users),
	};
}

// ============================================================================
// Mock Tool Context Factory
// ============================================================================

export function createMockToolContext(options: MockGitProviderOptions = {}): ToolContext {
	return {
		provider: createMockGitProvider(options),
		logger: createMockLogger(),
		request_id: 'test-request-id',
	};
}
