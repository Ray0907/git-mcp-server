/**
 * Git Provider Interface - Unified interface for GitLab/GitHub operations
 *
 * This interface defines the contract that all Git providers must implement.
 * Tools interact with this interface, not with platform-specific APIs.
 */

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
} from './types.js';

// ============================================================================
// Sub-interfaces
// ============================================================================

export interface IssueProvider {
	get(repo: string, issue_number: number): Promise<Issue>;
	list(repo: string, params?: IssueListParams): Promise<Issue[]>;
	create(repo: string, params: IssueCreateParams): Promise<Issue>;
	update(repo: string, issue_number: number, params: IssueUpdateParams): Promise<Issue>;
	createComment(repo: string, issue_number: number, params: CommentCreateParams): Promise<Comment>;
	listComments(repo: string, issue_number: number, params?: CommentListParams): Promise<Comment[]>;
}

export interface PullRequestProvider {
	get(repo: string, pr_number: number): Promise<PullRequest>;
	list(repo: string, params?: PullRequestListParams): Promise<PullRequest[]>;
	create(repo: string, params: PullRequestCreateParams): Promise<PullRequest>;
	getDiffs(repo: string, pr_number: number): Promise<PullRequestDiff[]>;
	merge(repo: string, pr_number: number, params?: PullRequestMergeParams): Promise<PullRequest>;
	createComment(repo: string, pr_number: number, params: CommentCreateParams): Promise<Comment>;
	listComments(repo: string, pr_number: number, params?: CommentListParams): Promise<Comment[]>;
}

export interface RepositoryProvider {
	getContent(repo: string, path: string, ref?: string): Promise<FileContent | DirectoryContent>;
	getTree(repo: string, params?: TreeParams): Promise<TreeEntry[]>;
	commit(repo: string, params: CommitParams): Promise<Commit>;
	listCommits(repo: string, params?: CommitListParams): Promise<Commit[]>;
	createBranch(repo: string, params: BranchCreateParams): Promise<Branch>;
	listBranches(repo: string, params?: BranchListParams): Promise<Branch[]>;
	searchCode(repo: string, params: SearchCodeParams): Promise<SearchCodeResult[]>;
}

export interface CIProvider {
	getPipeline(repo: string, pipeline_id: number): Promise<Pipeline>;
	listPipelines(repo: string, params?: PipelineListParams): Promise<Pipeline[]>;
	listJobs(repo: string, pipeline_id: number, params?: JobListParams): Promise<Job[]>;
	getJobLog(repo: string, job_id: number): Promise<string>;
}

// ============================================================================
// Main Provider Interface
// ============================================================================

export interface UserProvider {
	getMe(): Promise<User>;
}

/**
 * GitProvider - Unified interface for Git platform operations
 *
 * This is the main interface that tools use. It provides a consistent API
 * regardless of whether the underlying platform is GitLab or GitHub.
 *
 * Terminology mapping:
 * - repo: GitLab "project_id" or GitHub "owner/repo"
 * - issue_number: GitLab "issue_iid" or GitHub "issue_number"
 * - pr_number: GitLab "merge_request_iid" or GitHub "pull_number"
 * - pipeline_id: GitLab "pipeline_id" or GitHub "run_id"
 */
export interface GitProvider {
	/** Provider information */
	readonly info: ProviderInfo;

	/** Issue operations */
	readonly issues: IssueProvider;

	/** Pull/Merge request operations */
	readonly pullRequests: PullRequestProvider;

	/** Repository operations */
	readonly repository: RepositoryProvider;

	/** CI/CD operations */
	readonly ci: CIProvider;

	/** User operations */
	readonly users: UserProvider;
}

// ============================================================================
// Factory Type
// ============================================================================

export interface GitProviderOptions {
	base_url: string;
	token: string;
}

export type GitProviderFactory = (options: GitProviderOptions) => GitProvider;
