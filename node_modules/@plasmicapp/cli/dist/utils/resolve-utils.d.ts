import { SyncArgs } from "../actions/sync";
import { ProjectVersionMeta, VersionResolution } from "../api";
import { PlasmicContext } from "./config-utils";
/**
 * Checks the versionResolution with plasmic.json, plasmic.lock, and user prompts
 * to compute which projects should be synced
 * @param versionResolution
 * @param context
 */
export declare function checkVersionResolution(versionResolution: VersionResolution, context: PlasmicContext, opts: SyncArgs): Promise<ProjectVersionMeta[]>;
export declare function getDependencies(projectId: string, version: string, versionResolution: VersionResolution): {
    [projectId: string]: string;
} | undefined;
