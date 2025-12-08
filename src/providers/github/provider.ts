/**
 * GitHub Provider - Implementation of GitProvider interface for GitHub
 */

import type {
	GitProvider,
	IssueProvider,
	PullRequestProvider,
	RepositoryProvider,
	CIProvider,
	UserProvider,
} from '../interface.js';

import type {
	ProviderInfo,
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

import type { GitHubClient } from '../../github/client.js';
import type {
	GitHubIssue,
	GitHubPullRequest,
	GitHubPullRequestFile,
	GitHubContent,
	GitHubTree,
	GitHubCommit,
	GitHubBranch,
	GitHubRef,
	GitHubWorkflowRun,
	GitHubWorkflowRunList,
	GitHubWorkflowJobList,
	GitHubIssueComment,
	GitHubUser,
	GitHubSearchCodeResult,
	GitHubCreateCommitResponse,
} from '../../github/types.js';

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

// ============================================================================
// Issue Provider
// ============================================================================

function createIssueProvider(client: GitHubClient): IssueProvider {
	return {
		async get(repo, issue_number) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const data = await client.get<GitHubIssue>(
				`/repos/${owner}/${repo_name}/issues/${issue_number}`
			);
			return mapIssue(data);
		},

		async list(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const query = mapIssueListParams(params);
			const data = await client.get<GitHubIssue[]>(
				`/repos/${owner}/${repo_name}/issues`,
				query
			);
			// Filter out pull requests (GitHub API returns PRs in issues endpoint)
			return data.filter((i) => !i.pull_request).map(mapIssue);
		},

		async create(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const body = mapIssueCreateParams(params);
			const data = await client.post<GitHubIssue>(
				`/repos/${owner}/${repo_name}/issues`,
				body
			);
			return mapIssue(data);
		},

		async update(repo, issue_number, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const body = mapIssueUpdateParams(params);
			const data = await client.patch<GitHubIssue>(
				`/repos/${owner}/${repo_name}/issues/${issue_number}`,
				body
			);
			return mapIssue(data);
		},

		async createComment(repo, issue_number, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const data = await client.post<GitHubIssueComment>(
				`/repos/${owner}/${repo_name}/issues/${issue_number}/comments`,
				{ body: params.body }
			);
			return mapComment(data);
		},

		async listComments(repo, issue_number, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const query = mapCommentListParams(params);
			const data = await client.get<GitHubIssueComment[]>(
				`/repos/${owner}/${repo_name}/issues/${issue_number}/comments`,
				query
			);
			return data.map(mapComment);
		},
	};
}

function mapIssueListParams(params?: IssueListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		state: params.state === 'all' ? 'all' : params.state,
		labels: params.labels?.join(','),
		sort: params.sort === 'created' ? 'created' : params.sort === 'updated' ? 'updated' : undefined,
		direction: params.direction,
		page: params.page,
		per_page: params.per_page,
		// GitHub doesn't support search in list endpoint - need to use search API
		// assignee and creator use different parameter names
		assignee: params.assignee_id ? String(params.assignee_id) : undefined,
		creator: params.author_id ? String(params.author_id) : undefined,
	};
}

function mapIssueCreateParams(params: IssueCreateParams): Record<string, unknown> {
	return {
		title: params.title,
		body: params.description,
		labels: params.labels,
		assignees: params.assignee_ids, // GitHub uses usernames, but we'll pass IDs for consistency
	};
}

function mapIssueUpdateParams(params: IssueUpdateParams): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	if (params.title !== undefined) body.title = params.title;
	if (params.description !== undefined) body.body = params.description;
	if (params.labels !== undefined) body.labels = params.labels;
	if (params.assignee_ids !== undefined) body.assignees = params.assignee_ids;
	if (params.state !== undefined) body.state = params.state;
	return body;
}

// ============================================================================
// Pull Request Provider
// ============================================================================

function createPullRequestProvider(client: GitHubClient): PullRequestProvider {
	return {
		async get(repo, pr_number) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const data = await client.get<GitHubPullRequest>(
				`/repos/${owner}/${repo_name}/pulls/${pr_number}`
			);
			return mapPullRequest(data);
		},

		async list(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const query = mapPullRequestListParams(params);
			const data = await client.get<GitHubPullRequest[]>(
				`/repos/${owner}/${repo_name}/pulls`,
				query
			);
			return data.map(mapPullRequest);
		},

		async create(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const body = mapPullRequestCreateParams(params);
			const data = await client.post<GitHubPullRequest>(
				`/repos/${owner}/${repo_name}/pulls`,
				body
			);
			return mapPullRequest(data);
		},

		async getDiffs(repo, pr_number) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const data = await client.get<GitHubPullRequestFile[]>(
				`/repos/${owner}/${repo_name}/pulls/${pr_number}/files`
			);
			return data.map(mapPullRequestDiff);
		},

		async merge(repo, pr_number, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const body = mapPullRequestMergeParams(params);
			await client.put(
				`/repos/${owner}/${repo_name}/pulls/${pr_number}/merge`,
				body
			);
			// Fetch the updated PR to return
			const data = await client.get<GitHubPullRequest>(
				`/repos/${owner}/${repo_name}/pulls/${pr_number}`
			);
			return mapPullRequest(data);
		},

		async createComment(repo, pr_number, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			// PR comments use the issues API endpoint
			const data = await client.post<GitHubIssueComment>(
				`/repos/${owner}/${repo_name}/issues/${pr_number}/comments`,
				{ body: params.body }
			);
			return mapComment(data);
		},

		async listComments(repo, pr_number, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const query = mapCommentListParams(params);
			// PR comments use the issues API endpoint
			const data = await client.get<GitHubIssueComment[]>(
				`/repos/${owner}/${repo_name}/issues/${pr_number}/comments`,
				query
			);
			return data.map(mapComment);
		},
	};
}

function mapPullRequestListParams(params?: PullRequestListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};

	// GitHub uses different state values
	let state: string | undefined;
	if (params.state === 'merged') {
		// GitHub doesn't have 'merged' state - need to filter after
		state = 'closed';
	} else if (params.state === 'all') {
		state = 'all';
	} else {
		state = params.state;
	}

	return {
		state,
		head: params.source_branch,
		base: params.target_branch,
		sort: params.sort === 'created' ? 'created' : params.sort === 'updated' ? 'updated' : undefined,
		direction: params.direction,
		page: params.page,
		per_page: params.per_page,
	};
}

function mapPullRequestCreateParams(params: PullRequestCreateParams): Record<string, unknown> {
	return {
		title: params.title,
		body: params.description,
		head: params.source_branch,
		base: params.target_branch,
		draft: params.draft,
	};
}

function mapPullRequestMergeParams(params?: PullRequestMergeParams): Record<string, unknown> {
	if (!params) return {};
	return {
		commit_message: params.commit_message,
		merge_method: params.squash ? 'squash' : 'merge',
	};
}

// ============================================================================
// Repository Provider
// ============================================================================

function createRepositoryProvider(client: GitHubClient): RepositoryProvider {
	return {
		async getContent(repo, path, ref) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const params: Record<string, string | undefined> = {};
			if (ref) params.ref = ref;

			const data = await client.get<GitHubContent | GitHubContent[]>(
				`/repos/${owner}/${repo_name}/contents/${encodeURIComponent(path)}`,
				params
			);

			// Check if it's a directory (array) or file (object)
			if (Array.isArray(data)) {
				return mapDirectoryContent(path, data);
			}

			if (data.type === 'file' && data.content) {
				const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
				return mapFileContent(data, decoded);
			}

			// Directory with single item or other types
			return mapDirectoryContent(path, [data]);
		},

		async getTree(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);

			// Get default branch or specified ref
			let tree_sha = params?.ref || 'HEAD';

			// If recursive, we need to get the tree SHA first
			if (tree_sha === 'HEAD' || !tree_sha.match(/^[a-f0-9]{40}$/)) {
				// Get the reference to find tree SHA
				try {
					const ref_data = await client.get<GitHubRef>(
						`/repos/${owner}/${repo_name}/git/ref/heads/${tree_sha === 'HEAD' ? 'main' : tree_sha}`
					);
					tree_sha = ref_data.object.sha;
				} catch {
					// Try master if main doesn't exist
					const ref_data = await client.get<GitHubRef>(
						`/repos/${owner}/${repo_name}/git/ref/heads/master`
					);
					tree_sha = ref_data.object.sha;
				}
			}

			const query: Record<string, string | number | boolean | undefined> = {};
			if (params?.recursive) query.recursive = '1';

			const data = await client.get<GitHubTree>(
				`/repos/${owner}/${repo_name}/git/trees/${tree_sha}`,
				query
			);

			let entries = data.tree.map(mapTreeEntry);

			// Filter by path if specified
			if (params?.path) {
				const prefix = params.path.endsWith('/') ? params.path : `${params.path}/`;
				entries = entries.filter((e) => e.path.startsWith(prefix) || e.path === params.path);
			}

			// Apply pagination
			const page = params?.page || 1;
			const per_page = params?.per_page || 100;
			const start = (page - 1) * per_page;
			const end = start + per_page;

			return entries.slice(start, end);
		},

		async commit(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);

			// GitHub requires multiple API calls to create a commit:
			// 1. Get the current commit SHA of the branch
			// 2. Get the tree SHA of that commit
			// 3. Create blobs for new/updated files
			// 4. Create a new tree
			// 5. Create a new commit
			// 6. Update the branch reference

			// For simplicity, we'll use the Contents API for single file operations
			// For multiple files, we need the more complex Git Data API

			if (params.actions.length === 1 && params.actions[0].action !== 'delete') {
				// Simple case: single file create/update
				const action = params.actions[0];
				const endpoint = `/repos/${owner}/${repo_name}/contents/${encodeURIComponent(action.path)}`;

				let sha: string | undefined;
				if (action.action === 'update') {
					// Get current file SHA
					try {
						const current = await client.get<GitHubContent>(endpoint, { ref: params.branch });
						sha = current.sha;
					} catch {
						// File doesn't exist, treat as create
					}
				}

				const response = await client.put<{ commit: GitHubCommit }>(endpoint, {
					message: params.message,
					content: Buffer.from(action.content || '').toString('base64'),
					branch: params.branch,
					sha,
					author: params.author_name && params.author_email ? {
						name: params.author_name,
						email: params.author_email,
					} : undefined,
				});

				return mapCommit(response.commit);
			}

			// Complex case: multiple files - use Git Data API
			// Get the base branch reference
			const base_branch = params.base_branch || params.branch;
			let base_sha: string;

			try {
				const ref = await client.get<GitHubRef>(
					`/repos/${owner}/${repo_name}/git/ref/heads/${base_branch}`
				);
				base_sha = ref.object.sha;
			} catch {
				throw new Error(`Branch "${base_branch}" not found`);
			}

			// Get the base tree
			const base_commit = await client.get<{ tree: { sha: string } }>(
				`/repos/${owner}/${repo_name}/git/commits/${base_sha}`
			);

			// Create tree items
			const tree_items = await Promise.all(
				params.actions.map(async (action) => {
					if (action.action === 'delete') {
						return {
							path: action.path,
							mode: '100644' as const,
							type: 'blob' as const,
							sha: null,
						};
					}

					// Create blob for content
					const blob = await client.post<{ sha: string }>(
						`/repos/${owner}/${repo_name}/git/blobs`,
						{
							content: action.content || '',
							encoding: 'utf-8',
						}
					);

					return {
						path: action.action === 'move' ? action.path : action.path,
						mode: '100644' as const,
						type: 'blob' as const,
						sha: blob.sha,
					};
				})
			);

			// Create new tree
			const new_tree = await client.post<{ sha: string }>(
				`/repos/${owner}/${repo_name}/git/trees`,
				{
					base_tree: base_commit.tree.sha,
					tree: tree_items,
				}
			);

			// Create commit
			const commit_data: Record<string, unknown> = {
				message: params.message,
				tree: new_tree.sha,
				parents: [base_sha],
			};

			if (params.author_name && params.author_email) {
				commit_data.author = {
					name: params.author_name,
					email: params.author_email,
				};
			}

			const new_commit = await client.post<GitHubCreateCommitResponse>(
				`/repos/${owner}/${repo_name}/git/commits`,
				commit_data
			);

			// Update or create branch reference
			try {
				await client.patch(
					`/repos/${owner}/${repo_name}/git/refs/heads/${params.branch}`,
					{ sha: new_commit.sha }
				);
			} catch {
				// Branch doesn't exist, create it
				await client.post(
					`/repos/${owner}/${repo_name}/git/refs`,
					{
						ref: `refs/heads/${params.branch}`,
						sha: new_commit.sha,
					}
				);
			}

			return {
				sha: new_commit.sha,
				short_sha: new_commit.sha.substring(0, 7),
				message: new_commit.message,
				author_name: new_commit.author.name,
				author_email: new_commit.author.email,
				created_at: new_commit.author.date,
				web_url: new_commit.html_url,
			};
		},

		async listCommits(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const query = mapCommitListParams(params);
			const data = await client.get<GitHubCommit[]>(
				`/repos/${owner}/${repo_name}/commits`,
				query
			);
			return data.map(mapCommit);
		},

		async createBranch(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);

			// First, get the SHA of the source ref
			let sha: string;
			try {
				const ref = await client.get<GitHubRef>(
					`/repos/${owner}/${repo_name}/git/ref/heads/${params.ref}`
				);
				sha = ref.object.sha;
			} catch {
				// Maybe it's a commit SHA directly
				sha = params.ref;
			}

			// Create new branch reference
			await client.post(
				`/repos/${owner}/${repo_name}/git/refs`,
				{
					ref: `refs/heads/${params.name}`,
					sha,
				}
			);

			// Return branch info
			const branch = await client.get<GitHubBranch>(
				`/repos/${owner}/${repo_name}/branches/${params.name}`
			);
			return mapBranch(branch);
		},

		async listBranches(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const query: Record<string, string | number | boolean | undefined> = {
				page: params?.page,
				per_page: params?.per_page,
			};

			const data = await client.get<GitHubBranch[]>(
				`/repos/${owner}/${repo_name}/branches`,
				query
			);

			// Get default branch to mark it
			const repo_data = await client.get<{ default_branch: string }>(
				`/repos/${owner}/${repo_name}`
			);

			return data
				.filter((b) => !params?.search || b.name.includes(params.search))
				.map((b) => mapBranch(b, b.name === repo_data.default_branch));
		},

		async searchCode(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);

			// GitHub code search API
			const query = `${params.query} repo:${owner}/${repo_name}`;
			const search_params: Record<string, string | number | undefined> = {
				q: query,
				page: params.page,
				per_page: params.per_page,
			};

			const data = await client.get<GitHubSearchCodeResult>(
				'/search/code',
				search_params
			);

			return data.items.map((item): SearchCodeResult => ({
				path: item.path,
				matched_lines: item.text_matches?.map((m) => m.fragment) || [],
				ref: params.ref || 'HEAD',
			}));
		},
	};
}

function mapCommitListParams(params?: CommitListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		sha: params.ref,
		path: params.path,
		since: params.since,
		until: params.until,
		author: params.author,
		page: params.page,
		per_page: params.per_page,
	};
}

// ============================================================================
// CI Provider (GitHub Actions)
// ============================================================================

function createCIProvider(client: GitHubClient): CIProvider {
	return {
		async getPipeline(repo, pipeline_id) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const data = await client.get<GitHubWorkflowRun>(
				`/repos/${owner}/${repo_name}/actions/runs/${pipeline_id}`
			);
			return mapPipeline(data);
		},

		async listPipelines(repo, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const query = mapPipelineListParams(params);
			const data = await client.get<GitHubWorkflowRunList>(
				`/repos/${owner}/${repo_name}/actions/runs`,
				query
			);
			return data.workflow_runs.map(mapPipeline);
		},

		async listJobs(repo, pipeline_id, params) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			const query: Record<string, string | number | boolean | undefined> = {
				page: params?.page,
				per_page: params?.per_page,
			};

			const data = await client.get<GitHubWorkflowJobList>(
				`/repos/${owner}/${repo_name}/actions/runs/${pipeline_id}/jobs`,
				query
			);

			let jobs = data.jobs;

			// Filter by status if specified
			if (params?.status) {
				const target_status = params.status;
				jobs = jobs.filter((j) => {
					const mapped = mapJob(j);
					return mapped.status === target_status;
				});
			}

			return jobs.map(mapJob);
		},

		async getJobLog(repo, job_id) {
			const { owner, repo: repo_name } = client.parseRepo(repo);
			// GitHub returns a redirect to download the log
			return client.getRaw(
				`/repos/${owner}/${repo_name}/actions/jobs/${job_id}/logs`
			);
		},
	};
}

function mapPipelineListParams(params?: PipelineListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};

	// Map status to GitHub workflow run status
	let status: string | undefined;
	if (params.status) {
		switch (params.status) {
			case 'pending':
				status = 'queued';
				break;
			case 'running':
				status = 'in_progress';
				break;
			case 'success':
			case 'failed':
			case 'canceled':
			case 'skipped':
				status = 'completed';
				break;
		}
	}

	return {
		branch: params.ref,
		head_sha: params.sha,
		status,
		page: params.page,
		per_page: params.per_page,
	};
}

function mapCommentListParams(params?: CommentListParams): Record<string, string | number | boolean | undefined> {
	if (!params) return {};
	return {
		sort: 'created',
		direction: params.sort,
		page: params.page,
		per_page: params.per_page,
	};
}

// ============================================================================
// User Provider
// ============================================================================

function createUserProvider(client: GitHubClient): UserProvider {
	return {
		async getMe() {
			const data = await client.get<GitHubUser>('/user');
			return mapUser(data);
		},
	};
}

// ============================================================================
// Main Provider Factory
// ============================================================================

export function createGitHubProvider(client: GitHubClient, base_url?: string): GitProvider {
	return {
		info: {
			type: 'github',
			name: 'GitHub',
			version: '1.0.0',
			base_url: base_url || 'https://api.github.com',
		},
		issues: createIssueProvider(client),
		pullRequests: createPullRequestProvider(client),
		repository: createRepositoryProvider(client),
		ci: createCIProvider(client),
		users: createUserProvider(client),
	};
}
