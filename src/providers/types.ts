/**
 * Provider Types - Platform-agnostic interfaces for Git operations
 *
 * These types abstract away GitLab/GitHub specific details,
 * allowing tools to work with any Git platform.
 */

// ============================================================================
// Common Types
// ============================================================================

export interface PaginationParams {
	page?: number;
	per_page?: number;
}

export interface User {
	id: number;
	username: string;
	name: string;
	avatar_url?: string;
	web_url?: string;
}

// ============================================================================
// Issue Types
// ============================================================================

export interface Issue {
	id: number;
	iid: number;
	title: string;
	description: string | null;
	state: 'open' | 'closed';
	author: User;
	assignees: User[];
	labels: string[];
	created_at: string;
	updated_at: string;
	closed_at: string | null;
	web_url: string;
}

export interface IssueCreateParams {
	title: string;
	description?: string;
	labels?: string[];
	assignee_ids?: number[];
}

export interface IssueUpdateParams {
	title?: string;
	description?: string;
	labels?: string[];
	assignee_ids?: number[];
	state?: 'open' | 'closed';
}

export interface IssueListParams extends PaginationParams {
	state?: 'open' | 'closed' | 'all';
	labels?: string[];
	search?: string;
	assignee_id?: number;
	author_id?: number;
	sort?: 'created' | 'updated';
	direction?: 'asc' | 'desc';
}

// ============================================================================
// Pull/Merge Request Types
// ============================================================================

export interface PullRequest {
	id: number;
	iid: number;
	title: string;
	description: string | null;
	state: 'open' | 'closed' | 'merged';
	source_branch: string;
	target_branch: string;
	author: User;
	assignees: User[];
	reviewers: User[];
	labels: string[];
	draft: boolean;
	mergeable: boolean;
	created_at: string;
	updated_at: string;
	merged_at: string | null;
	web_url: string;
}

export interface PullRequestDiff {
	old_path: string;
	new_path: string;
	new_file: boolean;
	renamed_file: boolean;
	deleted_file: boolean;
	diff: string;
}

export interface PullRequestCreateParams {
	source_branch: string;
	target_branch: string;
	title: string;
	description?: string;
	assignee_ids?: number[];
	reviewer_ids?: number[];
	labels?: string[];
	draft?: boolean;
}

export interface PullRequestListParams extends PaginationParams {
	state?: 'open' | 'closed' | 'merged' | 'all';
	source_branch?: string;
	target_branch?: string;
	labels?: string[];
	search?: string;
	sort?: 'created' | 'updated';
	direction?: 'asc' | 'desc';
}

export interface PullRequestMergeParams {
	commit_message?: string;
	squash?: boolean;
	delete_branch?: boolean;
}

// ============================================================================
// Repository Types
// ============================================================================

export interface FileContent {
	type: 'file';
	path: string;
	name: string;
	size: number;
	content: string;
	encoding: string;
	sha: string;
}

export interface DirectoryContent {
	type: 'directory';
	path: string;
	entries: TreeEntry[];
}

export interface TreeEntry {
	name: string;
	path: string;
	type: 'file' | 'directory';
	mode: string;
	sha?: string;
}

export interface TreeParams extends PaginationParams {
	path?: string;
	ref?: string;
	recursive?: boolean;
}

export interface FileAction {
	action: 'create' | 'update' | 'delete' | 'move';
	path: string;
	content?: string;
	previous_path?: string;
}

export interface CommitParams {
	branch: string;
	message: string;
	actions: FileAction[];
	base_branch?: string;
	author_name?: string;
	author_email?: string;
}

export interface Commit {
	sha: string;
	short_sha: string;
	message: string;
	author_name: string;
	author_email: string;
	created_at: string;
	web_url?: string;
	stats?: {
		additions: number;
		deletions: number;
		total: number;
	};
}

// ============================================================================
// Branch Types
// ============================================================================

export interface Branch {
	name: string;
	sha: string;
	protected: boolean;
	default: boolean;
	web_url?: string;
}

export interface BranchCreateParams {
	name: string;
	ref: string;
}

export interface BranchListParams extends PaginationParams {
	search?: string;
}

// ============================================================================
// Commit List Types
// ============================================================================

export interface CommitListParams extends PaginationParams {
	ref?: string;
	path?: string;
	since?: string;
	until?: string;
	author?: string;
	with_stats?: boolean;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchCodeParams extends PaginationParams {
	query: string;
	ref?: string;
}

export interface SearchCodeResult {
	path: string;
	matched_lines: string[];
	ref: string;
}

// ============================================================================
// CI/CD Types
// ============================================================================

export interface Pipeline {
	id: number;
	status: 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped';
	ref: string;
	sha: string;
	created_at: string;
	updated_at: string;
	web_url: string;
}

export interface Job {
	id: number;
	name: string;
	status: 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped';
	stage: string;
	created_at: string;
	started_at: string | null;
	finished_at: string | null;
	duration: number | null;
	web_url: string;
}

export interface PipelineListParams extends PaginationParams {
	status?: Pipeline['status'];
	ref?: string;
	sha?: string;
	sort?: 'asc' | 'desc';
}

export interface JobListParams extends PaginationParams {
	status?: Job['status'];
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
	id: number;
	body: string;
	author: User;
	created_at: string;
	updated_at: string;
}

export interface CommentCreateParams {
	body: string;
}

export interface CommentListParams extends PaginationParams {
	sort?: 'asc' | 'desc';
}

// ============================================================================
// Provider Info
// ============================================================================

export type ProviderType = 'gitlab' | 'github';

export interface ProviderInfo {
	type: ProviderType;
	name: string;
	version: string;
	base_url: string;
}
