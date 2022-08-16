import { SyncArgs } from "../actions/sync";
import { PlasmicConfig, ProjectConfig } from "../utils/config-utils";
import { TempRepo } from "../utils/test-utils";
export declare const mockApi: any;
export declare let opts: SyncArgs;
export declare let tmpRepo: TempRepo;
export declare const defaultPlasmicJson: PlasmicConfig;
export declare function standardTestSetup(includeDep?: boolean): void;
export declare function standardTestTeardown(): void;
export declare function expectProject1Components(): void;
export declare const project1Config: ProjectConfig;
export declare function expectProject1PlasmicJson(optional?: {
    [k in keyof ProjectConfig]?: boolean;
}): void;
export declare function expectProjectAndDepPlasmicJson(): void;
