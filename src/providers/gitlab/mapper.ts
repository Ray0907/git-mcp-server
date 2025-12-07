/**
 * GitLab Mapper - Converts between GitLab API types and Provider types
 */

import type {
	User,
	Issue,
	PullRequest,
	PullRequestDiff,
	FileContent,
	DirectoryContent,
	TreeEntry,
	Commit,
	Branch,
	Pipeline,
	Job,
	Comment,
} from '../types.js';

import type {
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
	GitLabUser,
} from '../../gitlab/types.js';

// ============================================================================
// User Mapping
// ============================================================================

export function mapUser(user: GitLabUser): User {
	return {
		id: user.id,
		username: user.username,
		name: user.name,
		avatar_url: user.avatar_url ?? undefined,
		web_url: user.web_url,
	};
}

// ============================================================================
// Issue Mapping
// ============================================================================

export function mapIssue(issue: GitLabIssue): Issue {
	return {
		id: issue.id,
		iid: issue.iid,
		title: issue.title,
		description: issue.description,
		state: issue.state === 'opened' ? 'open' : 'closed',
		author: mapUser(issue.author),
		assignees: issue.assignees?.map(mapUser) ?? [],
		labels: issue.labels ?? [],
		created_at: issue.created_at,
		updated_at: issue.updated_at,
		closed_at: issue.closed_at,
		web_url: issue.web_url,
	};
}

// ============================================================================
// Pull Request (Merge Request) Mapping
// ============================================================================

export function mapPullRequest(mr: GitLabMergeRequest): PullRequest {
	return {
		id: mr.id,
		iid: mr.iid,
		title: mr.title,
		description: mr.description,
		state: mapMergeRequestState(mr.state),
		source_branch: mr.source_branch,
		target_branch: mr.target_branch,
		author: mapUser(mr.author),
		assignees: mr.assignees?.map(mapUser) ?? [],
		reviewers: mr.reviewers?.map(mapUser) ?? [],
		labels: mr.labels ?? [],
		draft: mr.draft ?? mr.work_in_progress ?? false,
		mergeable: mr.merge_status === 'can_be_merged',
		created_at: mr.created_at,
		updated_at: mr.updated_at,
		merged_at: mr.merged_at,
		web_url: mr.web_url,
	};
}

function mapMergeRequestState(state: string): PullRequest['state'] {
	switch (state) {
		case 'opened':
			return 'open';
		case 'merged':
			return 'merged';
		default:
			return 'closed';
	}
}

export function mapPullRequestDiff(diff: GitLabMergeRequestDiff): PullRequestDiff {
	return {
		old_path: diff.old_path,
		new_path: diff.new_path,
		new_file: diff.new_file,
		renamed_file: diff.renamed_file,
		deleted_file: diff.deleted_file,
		diff: diff.diff,
	};
}

// ============================================================================
// Repository Mapping
// ============================================================================

export function mapFileContent(file: GitLabFile, decoded_content: string): FileContent {
	return {
		type: 'file',
		path: file.file_path,
		name: file.file_name,
		size: file.size,
		content: decoded_content,
		encoding: 'utf-8',
		sha: file.content_sha256,
	};
}

export function mapDirectoryContent(path: string, items: GitLabTreeItem[]): DirectoryContent {
	return {
		type: 'directory',
		path,
		entries: items.map(mapTreeEntry),
	};
}

export function mapTreeEntry(item: GitLabTreeItem): TreeEntry {
	return {
		name: item.name,
		path: item.path,
		type: item.type === 'tree' ? 'directory' : 'file',
		mode: item.mode,
		sha: item.id,
	};
}

export function mapCommit(commit: GitLabCommit): Commit {
	return {
		sha: commit.id,
		short_sha: commit.short_id,
		message: commit.message,
		author_name: commit.author_name,
		author_email: commit.author_email,
		created_at: commit.authored_date,
		web_url: commit.web_url,
		stats: commit.stats,
	};
}

// ============================================================================
// Branch Mapping
// ============================================================================

export function mapBranch(branch: GitLabBranch): Branch {
	return {
		name: branch.name,
		sha: branch.commit.id,
		protected: branch.protected,
		default: branch.default,
		web_url: branch.web_url,
	};
}

// ============================================================================
// CI/CD Mapping
// ============================================================================

export function mapPipeline(pipeline: GitLabPipeline): Pipeline {
	return {
		id: pipeline.id,
		status: mapPipelineStatus(pipeline.status),
		ref: pipeline.ref,
		sha: pipeline.sha,
		created_at: pipeline.created_at,
		updated_at: pipeline.updated_at,
		web_url: pipeline.web_url,
	};
}

function mapPipelineStatus(status: string): Pipeline['status'] {
	const valid_statuses: Pipeline['status'][] = ['pending', 'running', 'success', 'failed', 'canceled', 'skipped'];
	return valid_statuses.includes(status as Pipeline['status'])
		? (status as Pipeline['status'])
		: 'pending';
}

export function mapJob(job: GitLabJob): Job {
	return {
		id: job.id,
		name: job.name,
		status: mapJobStatus(job.status),
		stage: job.stage,
		created_at: job.created_at,
		started_at: job.started_at,
		finished_at: job.finished_at,
		duration: job.duration,
		web_url: job.web_url,
	};
}

function mapJobStatus(status: string): Job['status'] {
	const valid_statuses: Job['status'][] = ['pending', 'running', 'success', 'failed', 'canceled', 'skipped'];
	return valid_statuses.includes(status as Job['status'])
		? (status as Job['status'])
		: 'pending';
}

// ============================================================================
// Comment (Note) Mapping
// ============================================================================

export function mapComment(note: GitLabNote): Comment {
	return {
		id: note.id,
		body: note.body,
		author: mapUser(note.author),
		created_at: note.created_at,
		updated_at: note.updated_at,
	};
}
