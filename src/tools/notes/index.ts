/**
 * Comment Tools
 */

export { createComment } from './create.js';
export { listComments } from './list.js';

import { createComment } from './create.js';
import { listComments } from './list.js';

export const commentTools = [
	createComment,
	listComments,
];
