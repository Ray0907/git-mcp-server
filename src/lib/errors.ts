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
// GitLab API Errors
// ============================================================================

export class GitLabError extends AppError {
	constructor(
		public readonly status: number,
		message: string,
		details?: unknown
	) {
		super(statusToCode(status), message, details);
		this.name = 'GitLabError';
	}

	get retryable(): boolean {
		return this.status === 429 || this.status >= 500;
	}
}

function statusToCode(status: number): string {
	switch (status) {
		case 400:
			return 'GITLAB_BAD_REQUEST';
		case 401:
			return 'GITLAB_UNAUTHORIZED';
		case 403:
			return 'GITLAB_FORBIDDEN';
		case 404:
			return 'GITLAB_NOT_FOUND';
		case 409:
			return 'GITLAB_CONFLICT';
		case 422:
			return 'GITLAB_VALIDATION_ERROR';
		case 429:
			return 'GITLAB_RATE_LIMITED';
		default:
			if (status >= 500) return 'GITLAB_SERVER_ERROR';
			return 'GITLAB_ERROR';
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
