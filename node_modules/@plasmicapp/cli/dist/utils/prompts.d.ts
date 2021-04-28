export declare function askChoice<T>(question: {
    message: string;
    choices: T[];
    defaultAnswer: T;
    hidePrompt: boolean;
}): T | Promise<T>;
