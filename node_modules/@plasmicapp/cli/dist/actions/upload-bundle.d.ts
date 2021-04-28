import { CommonArgs } from "..";
export interface UploadBundleArgs extends CommonArgs {
    project: string;
    bundleName: string;
    bundleJsFile: string;
    cssFiles: readonly string[];
    metaJsonFile: string;
    genModulePath?: string;
    genCssPaths: string[];
    pkgVersion?: string;
    extraPropMetaJsonFile?: string;
    themeProviderWrapper?: string;
    themeModuleFile?: string;
}
export declare function uploadJsBundle(opts: UploadBundleArgs): Promise<void>;
