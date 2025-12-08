/**
 * GitHub Mapper - Converts between GitHub API types and Provider types
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
} from '../../github/types.js';

// ============================================================================
// User Mapping
// ============================================================================

export function mapUser(user: GitHubUser): User {
	return {
		id: user.id,
		username: user.login,
		name: user.name || user.login,
		avatar_url: user.avatar_url,
		web_url: user.html_url,
	};
}

// ============================================================================
// Issue Mapping
// ============================================================================

export function mapIssue(issue: GitHubIssue): Issue {
	return {
		id: issue.id,
		iid: issue.number,
		title: issue.title,
		description: issue.body,
		state: issue.state, // GitHub already uses 'open' | 'closed'
		author: mapUser(issue.user),
		assignees: issue.assignees.map(mapUser),
		labels: issue.labels.map((l) => l.name),
		created_at: issue.created_at,
		updated_at: issue.updated_at,
		closed_at: issue.closed_at,
		web_url: issue.html_url,
	};
}

// ============================================================================
// Pull Request Mapping
// ============================================================================

export function mapPullRequest(pr: GitHubPullRequest): PullRequest {
	return {
		id: pr.id,
		iid: pr.number,
		title: pr.title,
		description: pr.body,
		state: mapPullRequestState(pr),
		source_branch: pr.head.ref,
		target_branch: pr.base.ref,
		author: mapUser(pr.user),
		assignees: pr.assignees.map(mapUser),
		reviewers: pr.requested_reviewers.map(mapUser),
		labels: pr.labels.map((l) => l.name),
		draft: pr.draft,
		mergeable: pr.mergeable ?? false,
		created_at: pr.created_at,
		updated_at: pr.updated_at,
		merged_at: pr.merged_at,
		web_url: pr.html_url,
	};
}

function mapPullRequestState(pr: GitHubPullRequest): PullRequest['state'] {
	if (pr.merged || pr.merged_at) {
		return 'merged';
	}
	return pr.state; // 'open' | 'closed'
}

export function mapPullRequestDiff(file: GitHubPullRequestFile): PullRequestDiff {
	return {
		old_path: file.previous_filename || file.filename,
		new_path: file.filename,
		new_file: file.status === 'added',
		renamed_file: file.status === 'renamed',
		deleted_file: file.status === 'removed',
		diff: file.patch || '',
	};
}

// ============================================================================
// Repository Mapping
// ============================================================================

export function mapFileContent(content: GitHubContent, decoded_content: string): FileContent {
	return {
		type: 'file',
		path: content.path,
		name: content.name,
		size: content.size,
		content: decoded_content,
		encoding: 'utf-8',
		sha: content.sha,
	};
}

export function mapDirectoryContent(path: string, items: GitHubContent[]): DirectoryContent {
	return {
		type: 'directory',
		path,
		entries: items.map(mapContentToTreeEntry),
	};
}

function mapContentToTreeEntry(content: GitHubContent): TreeEntry {
	return {
		name: content.name,
		path: content.path,
		type: content.type === 'dir' ? 'directory' : 'file',
		mode: content.type === 'dir' ? '040000' : '100644',
		sha: content.sha,
	};
}

export function mapTreeEntry(item: GitHubTreeItem): TreeEntry {
	return {
		name: item.path.split('/').pop() || item.path,
		path: item.path,
		type: item.type === 'tree' ? 'directory' : 'file',
		mode: item.mode,
		sha: item.sha,
	};
}

export function mapCommit(commit: GitHubCommit): Commit {
	return {
		sha: commit.sha,
		short_sha: commit.sha.substring(0, 7),
		message: commit.commit.message,
		author_name: commit.commit.author.name,
		author_email: commit.commit.author.email,
		created_at: commit.commit.author.date,
		web_url: commit.html_url,
		stats: commit.stats,
	};
}

// ============================================================================
// Branch Mapping
// ============================================================================

export function mapBranch(branch: GitHubBranch, is_default: boolean = false): Branch {
	return {
		name: branch.name,
		sha: branch.commit.sha,
		protected: branch.protected,
		default: is_default,
		web_url: undefined, // GitHub doesn't provide direct branch URL in API
	};
}

// ============================================================================
// CI/CD Mapping (GitHub Actions)
// ============================================================================

export function mapPipeline(run: GitHubWorkflowRun): Pipeline {
	return {
		id: run.id,
		status: mapWorkflowRunStatus(run),
		ref: run.head_branch,
		sha: run.head_sha,
		created_at: run.created_at,
		updated_at: run.updated_at,
		web_url: run.html_url,
	};
}

function mapWorkflowRunStatus(run: GitHubWorkflowRun): Pipeline['status'] {
	// If completed, use conclusion
	if (run.status === 'completed') {
		switch (run.conclusion) {
			case 'success':
				return 'success';
			case 'failure':
			case 'timed_out':
				return 'failed';
			case 'cancelled':
				return 'canceled';
			case 'skipped':
				return 'skipped';
			default:
				return 'pending';
		}
	}

	// Map in-progress states
	switch (run.status) {
		case 'in_progress':
			return 'running';
		case 'queued':
		case 'waiting':
		case 'pending':
		case 'requested':
		default:
			return 'pending';
	}
}

export function mapJob(job: GitHubWorkflowJob): Job {
	// Calculate duration if we have start and end times
	let duration: number | null = null;
	if (job.started_at && job.completed_at) {
		const start = new Date(job.started_at).getTime();
		const end = new Date(job.completed_at).getTime();
		duration = Math.round((end - start) / 1000); // seconds
	}

	return {
		id: job.id,
		name: job.name,
		status: mapJobStatus(job),
		stage: 'default', // GitHub Actions doesn't have stages like GitLab
		created_at: job.started_at || new Date().toISOString(),
		started_at: job.started_at,
		finished_at: job.completed_at,
		duration,
		web_url: job.html_url,
	};
}

function mapJobStatus(job: GitHubWorkflowJob): Job['status'] {
	if (job.status === 'completed') {
		switch (job.conclusion) {
			case 'success':
				return 'success';
			case 'failure':
			case 'timed_out':
				return 'failed';
			case 'cancelled':
				return 'canceled';
			case 'skipped':
				return 'skipped';
			default:
				return 'pending';
		}
	}

	switch (job.status) {
		case 'in_progress':
			return 'running';
		case 'queued':
		case 'waiting':
		case 'pending':
		case 'requested':
		default:
			return 'pending';
	}
}

// ============================================================================
// Comment Mapping
// ============================================================================

export function mapComment(comment: GitHubIssueComment): Comment {
	return {
		id: comment.id,
		body: comment.body,
		author: mapUser(comment.user),
		created_at: comment.created_at,
		updated_at: comment.updated_at,
	};
}
