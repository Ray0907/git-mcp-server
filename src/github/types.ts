/**
 * GitHub API Types - Response types from GitHub REST API
 */

// ============================================================================
// Common
// ============================================================================

export interface GitHubUser {
	id: number;
	login: string;
	name: string | null;
	avatar_url: string;
	html_url: string;
	type: 'User' | 'Bot' | 'Organization';
}

// ============================================================================
// Issues
// ============================================================================

export interface GitHubLabel {
	id: number;
	name: string;
	color: string;
	description: string | null;
}

export interface GitHubMilestone {
	id: number;
	number: number;
	title: string;
	description: string | null;
	state: 'open' | 'closed';
	due_on: string | null;
}

export interface GitHubIssue {
	id: number;
	number: number;
	title: string;
	body: string | null;
	state: 'open' | 'closed';
	state_reason: 'completed' | 'reopened' | 'not_planned' | null;
	user: GitHubUser;
	assignees: GitHubUser[];
	labels: GitHubLabel[];
	milestone: GitHubMilestone | null;
	created_at: string;
	updated_at: string;
	closed_at: string | null;
	html_url: string;
	// PR-related (issues API returns PRs too)
	pull_request?: {
		url: string;
		html_url: string;
	};
}

export interface GitHubIssueComment {
	id: number;
	body: string;
	user: GitHubUser;
	created_at: string;
	updated_at: string;
	html_url: string;
}

// ============================================================================
// Pull Requests
// ============================================================================

export interface GitHubPullRequest {
	id: number;
	number: number;
	title: string;
	body: string | null;
	state: 'open' | 'closed';
	draft: boolean;
	user: GitHubUser;
	assignees: GitHubUser[];
	requested_reviewers: GitHubUser[];
	labels: GitHubLabel[];
	head: {
		ref: string;
		sha: string;
		repo: {
			full_name: string;
		} | null;
	};
	base: {
		ref: string;
		sha: string;
		repo: {
			full_name: string;
		};
	};
	merged: boolean;
	mergeable: boolean | null;
	mergeable_state: string;
	merged_at: string | null;
	merged_by: GitHubUser | null;
	created_at: string;
	updated_at: string;
	closed_at: string | null;
	html_url: string;
}

export interface GitHubPullRequestFile {
	sha: string;
	filename: string;
	status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
	additions: number;
	deletions: number;
	changes: number;
	patch?: string;
	previous_filename?: string;
}

export interface GitHubPullRequestReviewComment {
	id: number;
	body: string;
	user: GitHubUser;
	created_at: string;
	updated_at: string;
	html_url: string;
	path: string;
	position: number | null;
	line: number | null;
}

// ============================================================================
// Repository
// ============================================================================

export interface GitHubRepository {
	id: number;
	name: string;
	full_name: string;
	description: string | null;
	private: boolean;
	default_branch: string;
	html_url: string;
	owner: GitHubUser;
	created_at: string;
	updated_at: string;
}

export interface GitHubContent {
	type: 'file' | 'dir' | 'symlink' | 'submodule';
	name: string;
	path: string;
	sha: string;
	size: number;
	html_url: string;
	// For files
	content?: string;
	encoding?: 'base64';
	// For directories (array of contents)
}

export interface GitHubTreeItem {
	path: string;
	mode: string;
	type: 'blob' | 'tree' | 'commit';
	sha: string;
	size?: number;
	url: string;
}

export interface GitHubTree {
	sha: string;
	url: string;
	tree: GitHubTreeItem[];
	truncated: boolean;
}

export interface GitHubCommit {
	sha: string;
	html_url: string;
	commit: {
		message: string;
		author: {
			name: string;
			email: string;
			date: string;
		};
		committer: {
			name: string;
			email: string;
			date: string;
		};
	};
	author: GitHubUser | null;
	committer: GitHubUser | null;
	stats?: {
		additions: number;
		deletions: number;
		total: number;
	};
}

export interface GitHubBranch {
	name: string;
	commit: {
		sha: string;
		url: string;
	};
	protected: boolean;
}

export interface GitHubRef {
	ref: string;
	node_id: string;
	url: string;
	object: {
		sha: string;
		type: string;
		url: string;
	};
}

// ============================================================================
// Code Search
// ============================================================================

export interface GitHubSearchCodeResult {
	total_count: number;
	incomplete_results: boolean;
	items: GitHubSearchCodeItem[];
}

export interface GitHubSearchCodeItem {
	name: string;
	path: string;
	sha: string;
	html_url: string;
	repository: {
		full_name: string;
	};
	text_matches?: Array<{
		fragment: string;
		matches: Array<{
			text: string;
			indices: [number, number];
		}>;
	}>;
}

// ============================================================================
// Actions (CI/CD)
// ============================================================================

export interface GitHubWorkflowRun {
	id: number;
	name: string | null;
	head_branch: string;
	head_sha: string;
	status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending';
	conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | 'neutral' | 'stale' | null;
	workflow_id: number;
	html_url: string;
	created_at: string;
	updated_at: string;
	run_started_at: string | null;
}

export interface GitHubWorkflowRunList {
	total_count: number;
	workflow_runs: GitHubWorkflowRun[];
}

export interface GitHubWorkflowJob {
	id: number;
	run_id: number;
	name: string;
	status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending';
	conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | 'neutral' | null;
	started_at: string | null;
	completed_at: string | null;
	html_url: string;
	steps?: GitHubWorkflowStep[];
}

export interface GitHubWorkflowStep {
	name: string;
	status: 'queued' | 'in_progress' | 'completed';
	conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
	number: number;
	started_at: string | null;
	completed_at: string | null;
}

export interface GitHubWorkflowJobList {
	total_count: number;
	jobs: GitHubWorkflowJob[];
}

// ============================================================================
// Content Creation (for commits)
// ============================================================================

export interface GitHubContentCreateResponse {
	content: GitHubContent | null;
	commit: {
		sha: string;
		html_url: string;
		message: string;
		author: {
			name: string;
			email: string;
			date: string;
		};
	};
}

export interface GitHubCreateTreeItem {
	path: string;
	mode: '100644' | '100755' | '040000' | '160000' | '120000';
	type: 'blob' | 'tree' | 'commit';
	sha?: string | null;
	content?: string;
}

export interface GitHubCreateCommitResponse {
	sha: string;
	html_url: string;
	message: string;
	author: {
		name: string;
		email: string;
		date: string;
	};
}
