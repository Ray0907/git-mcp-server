/**
 * GitLab API Types - Response types from GitLab REST API
 */

// ============================================================================
// Common
// ============================================================================

export interface GitLabUser {
	id: number;
	username: string;
	name: string;
	avatar_url: string | null;
	web_url: string;
}

export interface GitLabNamespace {
	id: number;
	name: string;
	path: string;
	kind: 'user' | 'group';
	full_path: string;
}

// ============================================================================
// Projects
// ============================================================================

export interface GitLabProject {
	id: number;
	name: string;
	path: string;
	path_with_namespace: string;
	description: string | null;
	default_branch: string;
	visibility: 'private' | 'internal' | 'public';
	web_url: string;
	namespace: GitLabNamespace;
	created_at: string;
	last_activity_at: string;
}

// ============================================================================
// Issues
// ============================================================================

export interface GitLabIssue {
	id: number;
	iid: number;
	project_id: number;
	title: string;
	description: string | null;
	state: 'opened' | 'closed';
	created_at: string;
	updated_at: string;
	closed_at: string | null;
	labels: string[];
	assignees: GitLabUser[];
	author: GitLabUser;
	milestone: GitLabMilestone | null;
	web_url: string;
}

export interface GitLabMilestone {
	id: number;
	iid: number;
	title: string;
	description: string | null;
	state: 'active' | 'closed';
	due_date: string | null;
}

// ============================================================================
// Merge Requests
// ============================================================================

export interface GitLabMergeRequest {
	id: number;
	iid: number;
	project_id: number;
	title: string;
	description: string | null;
	state: 'opened' | 'closed' | 'merged' | 'locked';
	source_branch: string;
	target_branch: string;
	source_project_id: number;
	target_project_id: number;
	author: GitLabUser;
	assignees: GitLabUser[];
	reviewers: GitLabUser[];
	labels: string[];
	draft: boolean;
	work_in_progress?: boolean; // Legacy field, replaced by draft
	merge_status: string;
	web_url: string;
	created_at: string;
	updated_at: string;
	merged_at: string | null;
	closed_at: string | null;
}

export interface GitLabMergeRequestDiff {
	old_path: string;
	new_path: string;
	a_mode: string;
	b_mode: string;
	new_file: boolean;
	renamed_file: boolean;
	deleted_file: boolean;
	diff: string;
}

// ============================================================================
// Pipelines
// ============================================================================

export interface GitLabPipeline {
	id: number;
	project_id: number;
	sha: string;
	ref: string;
	status: GitLabPipelineStatus;
	source: string;
	created_at: string;
	updated_at: string;
	web_url: string;
}

export type GitLabPipelineStatus =
	| 'created'
	| 'waiting_for_resource'
	| 'preparing'
	| 'pending'
	| 'running'
	| 'success'
	| 'failed'
	| 'canceled'
	| 'skipped'
	| 'manual'
	| 'scheduled';

export interface GitLabJob {
	id: number;
	name: string;
	stage: string;
	status: GitLabPipelineStatus;
	ref: string;
	created_at: string;
	started_at: string | null;
	finished_at: string | null;
	duration: number | null;
	web_url: string;
}

// ============================================================================
// Repository
// ============================================================================

export interface GitLabTreeItem {
	id: string;
	name: string;
	type: 'tree' | 'blob';
	path: string;
	mode: string;
}

export interface GitLabFile {
	file_name: string;
	file_path: string;
	size: number;
	encoding: string;
	content: string;
	content_sha256: string;
	ref: string;
	blob_id: string;
	commit_id: string;
	last_commit_id: string;
}

export interface GitLabCommit {
	id: string;
	short_id: string;
	title: string;
	message: string;
	author_name: string;
	author_email: string;
	authored_date: string;
	committer_name: string;
	committer_email: string;
	committed_date: string;
	web_url: string;
	parent_ids?: string[];
	stats?: {
		additions: number;
		deletions: number;
		total: number;
	};
}

export interface GitLabBranch {
	name: string;
	commit: GitLabCommit;
	merged: boolean;
	protected: boolean;
	developers_can_push: boolean;
	developers_can_merge: boolean;
	can_push: boolean;
	default: boolean;
	web_url: string;
}

// ============================================================================
// Notes / Comments
// ============================================================================

export interface GitLabNote {
	id: number;
	body: string;
	author: GitLabUser;
	created_at: string;
	updated_at: string;
	system: boolean;
	noteable_type: 'Issue' | 'MergeRequest';
	noteable_iid: number;
}

// ============================================================================
// Labels
// ============================================================================

export interface GitLabLabel {
	id: number;
	name: string;
	color: string;
	description: string | null;
	text_color: string;
}
