/**
 * GitLab API Client - Core HTTP layer
 */

import type { AuthProvider } from '../auth/types.js';
import type { Logger } from '../lib/logger.js';
import { GitLabError } from '../lib/errors.js';

// ============================================================================
// Types
// ============================================================================

export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	params?: Record<string, string | number | boolean | undefined>;
	body?: unknown;
	timeout_ms?: number;
}

export interface GitLabClientOptions {
	base_url: string;
	auth: AuthProvider;
	logger: Logger;
}

// ============================================================================
// Client
// ============================================================================

export class GitLabClient {
	private readonly base_url: string;
	private readonly auth: AuthProvider;
	private readonly logger: Logger;
	private readonly timeout_ms: number;

	constructor(options: GitLabClientOptions) {
		this.base_url = options.base_url.replace(/\/$/, '');
		this.auth = options.auth;
		this.logger = options.logger.child({ component: 'gitlab-client' });
		this.timeout_ms = 30000;
	}

	// ========================================================================
	// Core Request Method
	// ========================================================================

	async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const { method = 'GET', params, body, timeout_ms = this.timeout_ms } = options;

		// Build URL
		let url = `${this.base_url}${path}`;
		if (params) {
			const search = new URLSearchParams();
			for (const [key, value] of Object.entries(params)) {
				if (value !== undefined) {
					search.append(key, String(value));
				}
			}
			const query = search.toString();
			if (query) url += `?${query}`;
		}

		// Get auth headers
		const auth_headers = await this.auth.getHeaders();

		// Setup timeout
		const controller = new AbortController();
		const timeout_id = setTimeout(() => controller.abort(), timeout_ms);

		this.logger.debug(`${method} ${path}`, { params });

		try {
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					...auth_headers,
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			// Handle errors
			if (!response.ok) {
				const error_body = await response.text();
				let error_data: unknown;
				try {
					error_data = JSON.parse(error_body);
				} catch {
					error_data = error_body;
				}

				const message = this.extractErrorMessage(error_data) || response.statusText;
				throw new GitLabError(response.status, message, error_data);
			}

			// Handle empty response
			if (response.status === 204) {
				return undefined as T;
			}

			// Parse response
			const data = await response.json();
			return data as T;
		} catch (err) {
			if (err instanceof GitLabError) throw err;

			if (err instanceof Error && err.name === 'AbortError') {
				throw new GitLabError(408, 'Request timeout');
			}

			throw new GitLabError(0, err instanceof Error ? err.message : String(err));
		} finally {
			clearTimeout(timeout_id);
		}
	}

	// ========================================================================
	// Convenience Methods
	// ========================================================================

	get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
		return this.request<T>(path, { method: 'GET', params });
	}

	post<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>(path, { method: 'POST', body });
	}

	put<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>(path, { method: 'PUT', body });
	}

	patch<T>(path: string, body?: unknown): Promise<T> {
		return this.request<T>(path, { method: 'PATCH', body });
	}

	delete<T>(path: string): Promise<T> {
		return this.request<T>(path, { method: 'DELETE' });
	}

	/**
	 * Get raw text response (for job logs, etc.)
	 */
	async getRaw(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<string> {
		const { timeout_ms = this.timeout_ms } = {};

		let url = `${this.base_url}${path}`;
		if (params) {
			const search = new URLSearchParams();
			for (const [key, value] of Object.entries(params)) {
				if (value !== undefined) {
					search.append(key, String(value));
				}
			}
			const query = search.toString();
			if (query) url += `?${query}`;
		}

		const auth_headers = await this.auth.getHeaders();
		const controller = new AbortController();
		const timeout_id = setTimeout(() => controller.abort(), timeout_ms);

		this.logger.debug(`GET (raw) ${path}`, { params });

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Accept': 'text/plain',
					...auth_headers,
				},
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new GitLabError(response.status, response.statusText);
			}

			return await response.text();
		} catch (err) {
			if (err instanceof GitLabError) throw err;
			if (err instanceof Error && err.name === 'AbortError') {
				throw new GitLabError(408, 'Request timeout');
			}
			throw new GitLabError(0, err instanceof Error ? err.message : String(err));
		} finally {
			clearTimeout(timeout_id);
		}
	}

	// ========================================================================
	// Helpers
	// ========================================================================

	/**
	 * Encode project ID for URL path
	 */
	encodeProject(project_id: string): string {
		// If already looks like an ID number, use as-is
		if (/^\d+$/.test(project_id)) {
			return project_id;
		}
		// Otherwise URL-encode the path
		return encodeURIComponent(project_id);
	}

	private extractErrorMessage(data: unknown): string | null {
		if (typeof data === 'object' && data !== null) {
			const obj = data as Record<string, unknown>;
			if (typeof obj.message === 'string') return obj.message;
			if (typeof obj.error === 'string') return obj.error;
			if (Array.isArray(obj.message)) return obj.message.join(', ');
		}
		return null;
	}
}

// ============================================================================
// Factory
// ============================================================================

export function createGitLabClient(options: GitLabClientOptions): GitLabClient {
	return new GitLabClient(options);
}
