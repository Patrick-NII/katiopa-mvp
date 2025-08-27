export function apiError(message: string, code = 'BAD_REQUEST', details?: any) { return { error: { code, message, details } } }
