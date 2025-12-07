/**
 * get_me - Get current authenticated user
 *
 * Returns information about the currently authenticated user
 */

import { z } from 'zod';
import { defineTool } from '../define.js';

const schema = z.object({});

export const getMe = defineTool({
	name: 'get_me',
	description: 'Get information about the currently authenticated user.',
	schema,
	category: 'users',
	read_only: true,
	handler: async (_input, ctx) => {
		return ctx.provider.users.getMe();
	},
});
