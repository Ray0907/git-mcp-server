/**
 * Simple Logger - No dependencies
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

export interface Logger {
	debug(msg: string, data?: Record<string, unknown>): void;
	info(msg: string, data?: Record<string, unknown>): void;
	warn(msg: string, data?: Record<string, unknown>): void;
	error(msg: string, data?: Record<string, unknown>): void;
	child(context: Record<string, unknown>): Logger;
}

export function createLogger(options: { level?: LogLevel; context?: Record<string, unknown> } = {}): Logger {
	const threshold = LEVELS[options.level ?? 'info'];
	const context = options.context ?? {};

	const log = (level: LogLevel, msg: string, data?: Record<string, unknown>) => {
		if (LEVELS[level] < threshold) return;

		const entry = {
			time: new Date().toISOString(),
			level,
			msg,
			...context,
			...data,
		};

		const output = JSON.stringify(entry);

		if (level === 'error') {
			console.error(output);
		} else {
			console.log(output);
		}
	};

	return {
		debug: (msg, data) => log('debug', msg, data),
		info: (msg, data) => log('info', msg, data),
		warn: (msg, data) => log('warn', msg, data),
		error: (msg, data) => log('error', msg, data),
		child: (child_context) =>
			createLogger({
				level: options.level,
				context: { ...context, ...child_context },
			}),
	};
}
