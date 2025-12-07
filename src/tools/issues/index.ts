/**
 * Issue Tools - All issue-related tools
 */

export { getIssue } from './get.js';
export { listIssues } from './list.js';
export { createIssue } from './create.js';
export { updateIssue } from './update.js';

// Convenience array for bulk registration
import { getIssue } from './get.js';
import { listIssues } from './list.js';
import { createIssue } from './create.js';
import { updateIssue } from './update.js';

export const issueTools = [getIssue, listIssues, createIssue, updateIssue];
