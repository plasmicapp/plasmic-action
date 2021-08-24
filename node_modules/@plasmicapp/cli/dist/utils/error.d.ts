/**
 * Represents an error that doesn't need to be forwarded to Sentry.
 * These are errors that are user-fault, for example:
 * - Using an old version of CLI
 */
export declare class HandledError extends Error {
}
/**
 * Catches HandledErrors and just exits
 * Forwards all other errors along.
 * @param p
 * @returns
 */
export declare const handleError: <T>(p: Promise<T>) => Promise<T>;
