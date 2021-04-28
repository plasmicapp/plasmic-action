/**
 * Provide a standardized way to ask user to continue
 * @param message
 * @param yes - If true, always return true without prompting.
 * @param default - Override the default value returned if the user presses enter
 */
export declare function confirmWithUser(message: string, yes?: boolean, defaultAnswer?: "y" | "n"): Promise<boolean>;
