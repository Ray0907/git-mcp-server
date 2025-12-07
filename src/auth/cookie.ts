/**
 * Cookie-based Auth
 *
 * Uses cookies exported from browser (Netscape format)
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AuthProvider, CookieAuthConfig } from './types.js';

interface Cookie {
	name: string;
	value: string;
	domain: string;
	path: string;
	secure: boolean;
	expires: number;
}

export class CookieAuthProvider implements AuthProvider {
	private readonly cookie_path: string;
	private cookies: Cookie[] = [];

	constructor(config: CookieAuthConfig) {
		// Expand ~ to home directory
		this.cookie_path = config.cookie_path.startsWith('~/')
			? path.join(process.env.HOME ?? '', config.cookie_path.slice(2))
			: config.cookie_path;
	}

	async getHeaders(): Promise<Record<string, string>> {
		if (this.cookies.length === 0) {
			this.loadCookies();
		}

		// Filter valid cookies and build header
		const now = Date.now() / 1000;
		const valid_cookies = this.cookies.filter(c => c.expires === 0 || c.expires > now);

		if (valid_cookies.length === 0) {
			throw new Error('No valid cookies found');
		}

		const cookie_header = valid_cookies
			.map(c => `${c.name}=${c.value}`)
			.join('; ');

		return { 'Cookie': cookie_header };
	}

	async isValid(): Promise<boolean> {
		try {
			this.loadCookies();
			return this.cookies.length > 0;
		} catch {
			return false;
		}
	}

	private loadCookies(): void {
		if (!fs.existsSync(this.cookie_path)) {
			throw new Error(`Cookie file not found: ${this.cookie_path}`);
		}

		const content = fs.readFileSync(this.cookie_path, 'utf-8');
		this.cookies = [];

		for (let line of content.split('\n')) {
			// Handle #HttpOnly_ prefix
			if (line.startsWith('#HttpOnly_')) {
				line = line.slice(10);
			}

			// Skip comments and empty lines
			if (line.startsWith('#') || !line.trim()) {
				continue;
			}

			// Parse Netscape format: domain, flag, path, secure, expires, name, value
			const parts = line.split('\t');
			if (parts.length >= 7) {
				this.cookies.push({
					domain: parts[0],
					path: parts[2],
					secure: parts[3] === 'TRUE',
					expires: parseInt(parts[4], 10),
					name: parts[5],
					value: parts[6],
				});
			}
		}
	}
}

export function createCookieAuth(config: CookieAuthConfig): AuthProvider {
	return new CookieAuthProvider(config);
}
