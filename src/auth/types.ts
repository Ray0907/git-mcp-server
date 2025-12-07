/**
 * Auth Types
 */

export type AuthType = 'pat' | 'oauth' | 'cookie';

/**
 * Auth provider interface - all auth methods implement this
 */
export interface AuthProvider {
	/** Get current auth headers */
	getHeaders(): Promise<Record<string, string>>;
	/** Check if auth is valid */
	isValid(): Promise<boolean>;
	/** Refresh auth if needed (for OAuth) */
	refresh?(): Promise<void>;
}

/**
 * PAT config
 */
export interface PatAuthConfig {
	type: 'pat';
	token: string;
	/** Use Private-Token header instead of Bearer */
	use_private_token?: boolean;
}

/**
 * OAuth config
 */
export interface OAuthConfig {
	type: 'oauth';
	client_id: string;
	gitlab_url: string;
	scopes?: string[];
	token_path?: string;
}

/**
 * Cookie config
 */
export interface CookieAuthConfig {
	type: 'cookie';
	cookie_path: string;
}

export type AuthConfig = PatAuthConfig | OAuthConfig | CookieAuthConfig;
