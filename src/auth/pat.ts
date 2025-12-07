/**
 * Personal Access Token (PAT) Auth
 *
 * The simplest auth method - just a static token
 */

import type { AuthProvider, PatAuthConfig } from './types.js';

export class PatAuthProvider implements AuthProvider {
	private readonly token: string;
	private readonly use_private_token: boolean;

	constructor(config: PatAuthConfig) {
		this.token = config.token;
		this.use_private_token = config.use_private_token ?? false;
	}

	async getHeaders(): Promise<Record<string, string>> {
		if (this.use_private_token) {
			return { 'Private-Token': this.token };
		}
		return { 'Authorization': `Bearer ${this.token}` };
	}

	async isValid(): Promise<boolean> {
		return this.token.length > 0;
	}
}

export function createPatAuth(config: PatAuthConfig): AuthProvider {
	return new PatAuthProvider(config);
}
