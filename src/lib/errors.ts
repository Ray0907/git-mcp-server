/**
 * Error Types - Consistent error handling
 */

// ============================================================================
// Base Error
// ============================================================================

export class AppError extends Error {
	constructor(
		public readonly code: string,
		message: string,
		public readonly details?: unknown
	) {
		super(message);
		this.name = 'AppError';
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			details: this.details,
		};
	}
}

// ============================================================================
// Git API Errors (GitLab / GitHub)
// ============================================================================

export class GitApiError extends AppError {
	constructor(
		public readonly provider: 'gitlab' | 'github',
		public readonly status: number,
		message: string,
		details?: unknown
	) {
		super(gitStatusToCode(provider, status), message, details);
		this.name = 'GitApiError';
	}

	get retryable(): boolean {
		return this.status === 429 || this.status >= 500;
	}
}

/** @deprecated Use GitApiError instead */
export class GitLabError extends GitApiError {
	constructor(status: number, message: string, details?: unknown) {
		super('gitlab', status, message, details);
		this.name = 'GitLabError';
	}
}

export class GitHubError extends GitApiError {
	constructor(status: number, message: string, details?: unknown) {
		super('github', status, message, details);
		this.name = 'GitHubError';
	}
}

function gitStatusToCode(provider: 'gitlab' | 'github', status: number): string {
	const prefix = provider.toUpperCase();
	switch (status) {
		case 400:
			return `${prefix}_BAD_REQUEST`;
		case 401:
			return `${prefix}_UNAUTHORIZED`;
		case 403:
			return `${prefix}_FORBIDDEN`;
		case 404:
			return `${prefix}_NOT_FOUND`;
		case 409:
			return `${prefix}_CONFLICT`;
		case 422:
			return `${prefix}_VALIDATION_ERROR`;
		case 429:
			return `${prefix}_RATE_LIMITED`;
		default:
			if (status >= 500) return `${prefix}_SERVER_ERROR`;
			return `${prefix}_ERROR`;
	}
}

// ============================================================================
// Tool Errors
// ============================================================================

export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super('VALIDATION_ERROR', message, details);
		this.name = 'ValidationError';
	}
}

export class ToolNotFoundError extends AppError {
	constructor(tool_name: string) {
		super('TOOL_NOT_FOUND', `Tool "${tool_name}" not found`);
		this.name = 'ToolNotFoundError';
	}
}

// ============================================================================
// Error Formatting
// ============================================================================

export function formatError(err: unknown): { code: string; message: string; details?: unknown } {
	if (err instanceof AppError) {
		return err.toJSON();
	}

	if (err instanceof Error) {
		return {
			code: 'INTERNAL_ERROR',
			message: err.message,
		};
	}

	return {
		code: 'UNKNOWN_ERROR',
		message: String(err),
	};
}
