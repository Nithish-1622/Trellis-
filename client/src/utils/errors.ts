export const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message) return error.message
    return fallback
}

export const getErrorCode = (error: unknown): number | undefined => {
    if (typeof error !== 'object' || error === null || !('code' in error)) return undefined
    return typeof error.code === 'number' ? error.code : undefined
}
