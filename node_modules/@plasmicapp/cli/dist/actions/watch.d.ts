import { CommonArgs } from "..";
import { Metadata } from "../utils/get-context";
export interface WatchArgs extends CommonArgs {
    projects: readonly string[];
    forceOverwrite: boolean;
    newComponentScheme?: "blackbox" | "direct";
    appendJsxOnMissingBase?: boolean;
    yes?: boolean;
    force?: boolean;
    nonRecursive?: boolean;
    skipUpgradeCheck?: boolean;
    metadata?: string;
}
export declare function watchProjects(opts: WatchArgs, metadataDefaults?: Metadata, onProjectUpdate?: () => void): Promise<void>;
