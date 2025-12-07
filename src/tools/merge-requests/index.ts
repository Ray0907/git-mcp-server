/**
 * Pull Request Tools
 */

export { getPullRequest } from './get.js';
export { getPullRequestDiffs } from './get-diffs.js';
export { listPullRequests } from './list.js';
export { createPullRequest } from './create.js';
export { mergePullRequest } from './merge.js';

import { getPullRequest } from './get.js';
import { getPullRequestDiffs } from './get-diffs.js';
import { listPullRequests } from './list.js';
import { createPullRequest } from './create.js';
import { mergePullRequest } from './merge.js';

export const pullRequestTools = [
	getPullRequest,
	getPullRequestDiffs,
	listPullRequests,
	createPullRequest,
	mergePullRequest,
];
