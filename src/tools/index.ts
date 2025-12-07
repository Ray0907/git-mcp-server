/**
 * Tools Module - Central export point
 */

// Core exports
export { defineTool, repoParam, projectIdParam, paginationParams, withPagination } from './define.js';
export { ToolRegistry, createRegistry } from './registry.js';
export type { ToolDefinition, ToolContext, ToolHandler, ToolResult, AnyToolDefinition } from './types.js';

// Tool collections
export { repositoryTools } from './repository/index.js';
export { issueTools } from './issues/index.js';
export { pullRequestTools } from './merge-requests/index.js';
export { pipelineTools } from './pipelines/index.js';
export { commentTools } from './notes/index.js';
export { userTools } from './users/index.js';

// All tools combined
import { repositoryTools } from './repository/index.js';
import { issueTools } from './issues/index.js';
import { pullRequestTools } from './merge-requests/index.js';
import { pipelineTools } from './pipelines/index.js';
import { commentTools } from './notes/index.js';
import { userTools } from './users/index.js';

export const allTools = [
	...repositoryTools,
	...issueTools,
	...pullRequestTools,
	...pipelineTools,
	...commentTools,
	...userTools,
];
