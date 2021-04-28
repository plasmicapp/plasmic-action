import { SyncArgs } from "../actions/sync";
import { ChecksumBundle } from "../api";
import { PlasmicContext } from "./config-utils";
export declare function getChecksums(context: PlasmicContext, opts: SyncArgs, projectId: string, componentIds: string[]): ChecksumBundle;
