/**
 * OAuth 2.0 + PKCE Auth
 *
 * Browser-based flow with automatic token refresh
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as crypto from 'crypto';
import type { AuthProvider, OAuthConfig } from './types.js';

interface TokenData {
	access_token: string;
	refresh_token?: string;
	expires_in?: number;
	created_at: number;
	token_type: string;
}

export class OAuthProvider implements AuthProvider {
	private readonly config: OAuthConfig;
	private readonly token_path: string;
	private token_data: TokenData | null = null;

	constructor(config: OAuthConfig) {
		this.config = config;
		this.token_path = config.token_path ?? path.join(
			process.env.HOME ?? '/tmp',
			'.gitlab-mcp-oauth-token.json'
		);
	}

	async getHeaders(): Promise<Record<string, string>> {
		const token = await this.getAccessToken();
		return { 'Authorization': `Bearer ${token}` };
	}

	async isValid(): Promise<boolean> {
		try {
			await this.getAccessToken();
			return true;
		} catch {
			return false;
		}
	}

	async refresh(): Promise<void> {
		if (this.token_data?.refresh_token) {
			await this.refreshToken();
		} else {
			await this.authenticate();
		}
	}

	// ========================================================================
	// Token Management
	// ========================================================================

	private async getAccessToken(): Promise<string> {
		// Try load from file
		if (!this.token_data) {
			this.token_data = this.loadToken();
		}

		// Check if expired
		if (this.token_data && this.isExpired(this.token_data)) {
			if (this.token_data.refresh_token) {
				await this.refreshToken();
			} else {
				this.token_data = null;
			}
		}

		// Need to authenticate
		if (!this.token_data) {
			await this.authenticate();
		}

		if (!this.token_data) {
			throw new Error('Failed to obtain OAuth token');
		}

		return this.token_data.access_token;
	}

	private isExpired(token: TokenData): boolean {
		if (!token.expires_in) return false;
		const expires_at = (token.created_at + token.expires_in) * 1000;
		// Refresh 5 minutes before expiry
		return Date.now() > expires_at - 5 * 60 * 1000;
	}

	private loadToken(): TokenData | null {
		try {
			if (fs.existsSync(this.token_path)) {
				const data = fs.readFileSync(this.token_path, 'utf-8');
				return JSON.parse(data);
			}
		} catch {
			// Ignore
		}
		return null;
	}

	private saveToken(token: TokenData): void {
		fs.writeFileSync(this.token_path, JSON.stringify(token, null, 2));
	}

	// ========================================================================
	// OAuth Flow
	// ========================================================================

	private async authenticate(): Promise<void> {
		const { code_verifier, code_challenge } = this.generatePkce();
		const state = crypto.randomBytes(16).toString('hex');
		const redirect_port = 8585;
		const redirect_uri = `http://127.0.0.1:${redirect_port}/callback`;

		// Build auth URL
		const auth_url = new URL(`${this.config.gitlab_url}/oauth/authorize`);
		auth_url.searchParams.set('client_id', this.config.client_id);
		auth_url.searchParams.set('redirect_uri', redirect_uri);
		auth_url.searchParams.set('response_type', 'code');
		auth_url.searchParams.set('state', state);
		auth_url.searchParams.set('code_challenge', code_challenge);
		auth_url.searchParams.set('code_challenge_method', 'S256');
		auth_url.searchParams.set('scope', (this.config.scopes ?? ['api', 'read_user']).join(' '));

		// Start callback server
		const code = await this.waitForCallback(redirect_port, state, auth_url.toString());

		// Exchange code for token
		await this.exchangeCode(code, code_verifier, redirect_uri);
	}

	private async waitForCallback(port: number, expected_state: string, auth_url: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const server = http.createServer((req, res) => {
				const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);

				if (url.pathname === '/callback') {
					const code = url.searchParams.get('code');
					const state = url.searchParams.get('state');
					const error = url.searchParams.get('error');

					if (error) {
						res.writeHead(400, { 'Content-Type': 'text/html' });
						res.end(`<h1>Error: ${error}</h1>`);
						server.close();
						reject(new Error(`OAuth error: ${error}`));
						return;
					}

					if (state !== expected_state) {
						res.writeHead(400, { 'Content-Type': 'text/html' });
						res.end('<h1>Invalid state</h1>');
						server.close();
						reject(new Error('Invalid OAuth state'));
						return;
					}

					if (!code) {
						res.writeHead(400, { 'Content-Type': 'text/html' });
						res.end('<h1>No code received</h1>');
						server.close();
						reject(new Error('No OAuth code received'));
						return;
					}

					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end('<h1>Authentication successful!</h1><p>You can close this window.</p>');
					server.close();
					resolve(code);
				}
			});

			server.listen(port, '127.0.0.1', () => {
				console.log(`\nOpen this URL to authenticate:\n${auth_url}\n`);
				// Try to open browser
				import('open').then((open) => open.default(auth_url)).catch(() => {});
			});

			// Timeout after 5 minutes
			setTimeout(() => {
				server.close();
				reject(new Error('OAuth timeout'));
			}, 5 * 60 * 1000);
		});
	}

	private async exchangeCode(code: string, code_verifier: string, redirect_uri: string): Promise<void> {
		const response = await fetch(`${this.config.gitlab_url}/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: this.config.client_id,
				code,
				code_verifier,
				grant_type: 'authorization_code',
				redirect_uri,
			}),
		});

		if (!response.ok) {
			throw new Error(`Token exchange failed: ${response.status}`);
		}

		const data = await response.json() as TokenData;
		data.created_at = data.created_at ?? Math.floor(Date.now() / 1000);
		this.token_data = data;
		this.saveToken(data);
	}

	private async refreshToken(): Promise<void> {
		if (!this.token_data?.refresh_token) {
			throw new Error('No refresh token available');
		}

		const response = await fetch(`${this.config.gitlab_url}/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: this.config.client_id,
				refresh_token: this.token_data.refresh_token,
				grant_type: 'refresh_token',
			}),
		});

		if (!response.ok) {
			// Refresh failed, need to re-authenticate
			this.token_data = null;
			await this.authenticate();
			return;
		}

		const data = await response.json() as TokenData;
		data.created_at = data.created_at ?? Math.floor(Date.now() / 1000);
		this.token_data = data;
		this.saveToken(data);
	}

	// ========================================================================
	// PKCE
	// ========================================================================

	private generatePkce(): { code_verifier: string; code_challenge: string } {
		const code_verifier = crypto.randomBytes(32)
			.toString('base64url')
			.replace(/[^a-zA-Z0-9]/g, '')
			.slice(0, 128);

		const code_challenge = crypto
			.createHash('sha256')
			.update(code_verifier)
			.digest('base64url');

		return { code_verifier, code_challenge };
	}
}

export function createOAuth(config: OAuthConfig): AuthProvider {
	return new OAuthProvider(config);
}
