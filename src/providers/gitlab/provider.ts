/**
 * GitLab Provider - Implementation of GitProvider interface for GitLab
 */

import type {
	GitProvider,
	IssueProvider,
	PullRequestProvider,
	RepositoryProvider,
	CIProvider,
	UserProvider,
	GitProviderOptions,
} from '../interface.js';

import type {
	ProviderInfo,
	User,
	Issue,
	IssueCreateParams,
	IssueUpdateParams,
	IssueListParams,
	PullRequest,
	PullRequestDiff,
	PullRequestCreateParams,
	PullRequestListParams,
	PullRequestMergeParams,
	FileContent,
	DirectoryContent,
	TreeEntry,
	TreeParams,
	CommitParams,
	Commit,
	CommitListParams,
	Branch,
	BranchCreateParams,
	BranchListParams,
	SearchCodeParams,
	SearchCodeResult,
	Pipeline,
	PipelineListParams,
	Job,
	JobListParams,
	Comment,
	CommentCreateParams,
	CommentListParams,
} from '../types.js';

import type { GitLabClient } from '../../gitlab/client.js';
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

import {
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
	mapUser,
} from './mapper.js';

// ============================================================================
// Issue Provider
// ============================================================================

function createIssueProvider(client: GitLabClient): IssueProvider {
	const encode = (id: string) => client.encodeProject(id);

	return {
		async get(repo, issue_number) {
			const data = await client.get<GitLabIssue>(
				`/projects/${encode(repo)}/issues/${issue_number}`
			);
			return mapIssue(data);
		},

		async list(repo, params) {
			const query = mapIssueListParams(params);
			const data = await client.get<GitLabIssue[]>(
				`/projects/${encode(repo)}/issues`,
				query
			);
			return data.map(mapIssue);
		},

		async create(repo, params) {
			const body = mapIssueCreateParams(params);
			const data = await client.post<GitLabIssue>(
				`/projects/${encode(repo)}/issues`,
				body
			);
			return mapIssue(data);
		},

		async update(repo, issue_number, params) {
			const body = mapIssueUpdateParams(params);
			const data = await client.put<GitLabIssue>(
				`/projects/${encode(repo)}/issues/${issue_number}`,
				body
			);
			return mapIssue(data);
		},

		async createComment(repo, issue_number, params) {
			const data = await client.post<GitLabNote>(
				`/projects/${encode(repo)}/issues/${issue_number}/notes`,
				{ body: params.body }
			);
			return mapComment(data);
		},

		async listComments(repo, issue_number, params) {
			const query = mapCommentListParams(params);
			const data = await client.get<GitLabNote[]>(
				`/projects/${encode(repo)}/issues/${issue_number}/notes`,
				query
			);
			return data.map(mapComment);
		},
	};
}

function mapIssueListParams(params?: IssueListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		state: params.state === 'open' ? 'opened' : params.state,
		labels: params.labels?.join(','),
		search: params.search,
		assignee_id: params.assignee_id,
		author_id: params.author_id,
		order_by: params.sort === 'created' ? 'created_at' : params.sort === 'updated' ? 'updated_at' : undefined,
		sort: params.direction,
		page: params.page,
		per_page: params.per_page,
	};
}

function mapIssueCreateParams(params: IssueCreateParams): Record<string, unknown> {
	return {
		title: params.title,
		description: params.description,
		labels: params.labels?.join(','),
		assignee_ids: params.assignee_ids,
	};
}

function mapIssueUpdateParams(params: IssueUpdateParams): Record<string, unknown> {
	return {
		title: params.title,
		description: params.description,
		labels: params.labels?.join(','),
		assignee_ids: params.assignee_ids,
		state_event: params.state === 'open' ? 'reopen' : params.state === 'closed' ? 'close' : undefined,
	};
}

// ============================================================================
// Pull Request Provider
// ============================================================================

function createPullRequestProvider(client: GitLabClient): PullRequestProvider {
	const encode = (id: string) => client.encodeProject(id);

	return {
		async get(repo, pr_number) {
			const data = await client.get<GitLabMergeRequest>(
				`/projects/${encode(repo)}/merge_requests/${pr_number}`
			);
			return mapPullRequest(data);
		},

		async list(repo, params) {
			const query = mapPullRequestListParams(params);
			const data = await client.get<GitLabMergeRequest[]>(
				`/projects/${encode(repo)}/merge_requests`,
				query
			);
			return data.map(mapPullRequest);
		},

		async create(repo, params) {
			const body = mapPullRequestCreateParams(params);
			const data = await client.post<GitLabMergeRequest>(
				`/projects/${encode(repo)}/merge_requests`,
				body
			);
			return mapPullRequest(data);
		},

		async getDiffs(repo, pr_number) {
			const data = await client.get<{ changes: GitLabMergeRequestDiff[] }>(
				`/projects/${encode(repo)}/merge_requests/${pr_number}/changes`
			);
			return data.changes.map(mapPullRequestDiff);
		},

		async merge(repo, pr_number, params) {
			const body = mapPullRequestMergeParams(params);
			const data = await client.put<GitLabMergeRequest>(
				`/projects/${encode(repo)}/merge_requests/${pr_number}/merge`,
				body
			);
			return mapPullRequest(data);
		},

		async createComment(repo, pr_number, params) {
			const data = await client.post<GitLabNote>(
				`/projects/${encode(repo)}/merge_requests/${pr_number}/notes`,
				{ body: params.body }
			);
			return mapComment(data);
		},

		async listComments(repo, pr_number, params) {
			const query = mapCommentListParams(params);
			const data = await client.get<GitLabNote[]>(
				`/projects/${encode(repo)}/merge_requests/${pr_number}/notes`,
				query
			);
			return data.map(mapComment);
		},
	};
}

function mapPullRequestListParams(params?: PullRequestListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		state: params.state === 'open' ? 'opened' : params.state,
		source_branch: params.source_branch,
		target_branch: params.target_branch,
		labels: params.labels?.join(','),
		search: params.search,
		order_by: params.sort === 'created' ? 'created_at' : params.sort === 'updated' ? 'updated_at' : undefined,
		sort: params.direction,
		page: params.page,
		per_page: params.per_page,
	};
}

function mapPullRequestCreateParams(params: PullRequestCreateParams): Record<string, unknown> {
	return {
		source_branch: params.source_branch,
		target_branch: params.target_branch,
		title: params.title,
		description: params.description,
		assignee_ids: params.assignee_ids,
		reviewer_ids: params.reviewer_ids,
		labels: params.labels?.join(','),
		draft: params.draft,
	};
}

function mapPullRequestMergeParams(params?: PullRequestMergeParams): Record<string, unknown> {
	if (!params) return {};
	return {
		merge_commit_message: params.commit_message,
		squash: params.squash,
		should_remove_source_branch: params.delete_branch,
	};
}

// ============================================================================
// Repository Provider
// ============================================================================

function createRepositoryProvider(client: GitLabClient): RepositoryProvider {
	const encode = (id: string) => client.encodeProject(id);

	return {
		async getContent(repo, path, ref) {
			const encoded_path = encodeURIComponent(path);

			try {
				const file = await client.get<GitLabFile>(
					`/projects/${encode(repo)}/repository/files/${encoded_path}`,
					ref ? { ref } : undefined
				);

				const content = Buffer.from(file.content, 'base64').toString('utf-8');
				return mapFileContent(file, content);
			} catch (err) {
				if (err instanceof Error && err.message.includes('404')) {
					const items = await client.get<GitLabTreeItem[]>(
						`/projects/${encode(repo)}/repository/tree`,
						{ path, ref }
					);
					return mapDirectoryContent(path, items);
				}
				throw err;
			}
		},

		async getTree(repo, params) {
			const query = mapTreeParams(params);
			const data = await client.get<GitLabTreeItem[]>(
				`/projects/${encode(repo)}/repository/tree`,
				query
			);
			return data.map(mapTreeEntry);
		},

		async commit(repo, params) {
			const body = mapCommitParams(params);
			const data = await client.post<GitLabCommit>(
				`/projects/${encode(repo)}/repository/commits`,
				body
			);
			return mapCommit(data);
		},

		async listCommits(repo, params) {
			const query = mapCommitListParams(params);
			const data = await client.get<GitLabCommit[]>(
				`/projects/${encode(repo)}/repository/commits`,
				query
			);
			return data.map(mapCommit);
		},

		async createBranch(repo, params) {
			const data = await client.post<GitLabBranch>(
				`/projects/${encode(repo)}/repository/branches`,
				{ branch: params.name, ref: params.ref }
			);
			return mapBranch(data);
		},

		async listBranches(repo, params) {
			const query = mapBranchListParams(params);
			const data = await client.get<GitLabBranch[]>(
				`/projects/${encode(repo)}/repository/branches`,
				query
			);
			return data.map(mapBranch);
		},

		async searchCode(repo, params) {
			// GitLab uses project search API for code search
			const query: Record<string, string | number | boolean | undefined> = {
				scope: 'blobs',
				search: params.query,
				ref: params.ref,
				page: params.page,
				per_page: params.per_page,
			};
			const data = await client.get<GitLabSearchResult[]>(
				`/projects/${encode(repo)}/search`,
				query
			);
			return data.map(mapSearchCodeResult);
		},
	};
}

function mapTreeParams(params?: TreeParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		path: params.path,
		ref: params.ref,
		recursive: params.recursive,
		page: params.page,
		per_page: params.per_page,
	};
}

function mapCommitParams(params: CommitParams): Record<string, unknown> {
	return {
		branch: params.branch,
		commit_message: params.message,
		start_branch: params.base_branch,
		author_name: params.author_name,
		author_email: params.author_email,
		actions: params.actions.map((action) => ({
			action: action.action,
			file_path: action.path,
			content: action.content,
			previous_path: action.previous_path,
		})),
	};
}

function mapCommitListParams(params?: CommitListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		ref_name: params.ref,
		path: params.path,
		since: params.since,
		until: params.until,
		author: params.author,
		with_stats: params.with_stats,
		page: params.page,
		per_page: params.per_page,
	};
}

function mapBranchListParams(params?: BranchListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		search: params.search,
		page: params.page,
		per_page: params.per_page,
	};
}

// GitLab search result type (internal)
interface GitLabSearchResult {
	basename: string;
	data: string;
	path: string;
	filename: string;
	id: string | null;
	ref: string;
	startline: number;
	project_id: number;
}

function mapSearchCodeResult(result: GitLabSearchResult): SearchCodeResult {
	// GitLab returns matched content in data field
	const matched_lines = result.data.split('\n').filter((line) => line.trim());
	return {
		path: result.path,
		matched_lines,
		ref: result.ref,
	};
}

// ============================================================================
// CI Provider
// ============================================================================

function createCIProvider(client: GitLabClient): CIProvider {
	const encode = (id: string) => client.encodeProject(id);

	return {
		async getPipeline(repo, pipeline_id) {
			const data = await client.get<GitLabPipeline>(
				`/projects/${encode(repo)}/pipelines/${pipeline_id}`
			);
			return mapPipeline(data);
		},

		async listPipelines(repo, params) {
			const query = mapPipelineListParams(params);
			const data = await client.get<GitLabPipeline[]>(
				`/projects/${encode(repo)}/pipelines`,
				query
			);
			return data.map(mapPipeline);
		},

		async listJobs(repo, pipeline_id, params) {
			const query = mapJobListParams(params);
			const data = await client.get<GitLabJob[]>(
				`/projects/${encode(repo)}/pipelines/${pipeline_id}/jobs`,
				query
			);
			return data.map(mapJob);
		},

		async getJobLog(repo, job_id) {
			return client.getRaw(
				`/projects/${encode(repo)}/jobs/${job_id}/trace`
			);
		},
	};
}

function mapPipelineListParams(params?: PipelineListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		status: params.status,
		ref: params.ref,
		sha: params.sha,
		sort: params.sort,
		page: params.page,
		per_page: params.per_page,
	};
}

function mapJobListParams(params?: JobListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		scope: params.status,
		page: params.page,
		per_page: params.per_page,
	};
}

function mapCommentListParams(params?: CommentListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		sort: params.sort,
		page: params.page,
		per_page: params.per_page,
	};
}

// ============================================================================
// User Provider
// ============================================================================

function createUserProvider(client: GitLabClient): UserProvider {
	return {
		async getMe() {
			const data = await client.get<GitLabUser>('/user');
			return mapUser(data);
		},
	};
}

// ============================================================================
// Main Provider Factory
// ============================================================================

export function createGitLabProvider(client: GitLabClient, base_url: string): GitProvider {
	return {
		info: {
			type: 'gitlab',
			name: 'GitLab',
			version: '1.0.0',
			base_url,
		},
		issues: createIssueProvider(client),
		pullRequests: createPullRequestProvider(client),
		repository: createRepositoryProvider(client),
		ci: createCIProvider(client),
		users: createUserProvider(client),
	};
}
