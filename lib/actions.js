"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlasmicAction = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const exec_1 = require("./exec");
const util_1 = require("./util");
const create_plasmic_app_1 = require("create-plasmic-app");
const gitUserName = "Plasmic Bot";
const gitUserEmail = "ops+git@plasmic.app";
class PlasmicAction {
    args;
    opts;
    remote;
    constructor(args) {
        this.args = args;
        this.opts = {
            cwd: path_1.default.join(".", args.directory || "."),
            shell: "bash",
        };
        this.remote = args.githubToken
            ? `https://x-access-token:${args.githubToken}@github.com/${process.env["GITHUB_REPOSITORY"]}.git`
            : undefined;
    }
    async run() {
        switch (this.args.run) {
            case "init":
                const synced = await this.init();
                return { synced };
            case "sync":
                const new_branch = await this.sync();
                return { new_branch };
            case "build":
                const publish_dir = await this.build();
                return { publish_dir };
            default:
                throw new Error(`Unknown run action: ${this.args.run}`);
        }
    }
    /**
     * Detects if there is a project in the working directory (by testing
     * package.json existence). If there isn't, use create-plasmic-app to
     * create a new one.
     *
     * @returns {synced} boolean indicating whether projectId was synced or not.
     */
    async init() {
        const isNewApp = !(0, fs_1.existsSync)(path_1.default.join(this.opts.cwd, "package.json"));
        if (!isNewApp) {
            console.log("Detected existing app. Moving forward...");
            await this.updateDependencies();
            return false;
        }
        (0, util_1.assertNoSingleQuotes)(this.args.branch);
        (0, util_1.assertNoSingleQuotes)(this.args.platform);
        (0, util_1.assertNoSingleQuotes)(this.args.scheme);
        (0, util_1.assertNoSingleQuotes)(this.args.projectId);
        (0, util_1.assertNoSingleQuotes)(this.args.projectApiToken);
        if (this.args.platform === "" || this.args.scheme === "") {
            throw new Error("Platform and scheme must be specified.");
        }
        await (0, exec_1.exec)(`git checkout '${this.args.branch}'`, this.opts);
        (0, create_plasmic_app_1.setMetadata)({
            source: "plasmic-action",
        });
        const relTmpDir = "tmp-cpa";
        await (0, create_plasmic_app_1.create)({
            resolvedProjectPath: path_1.default.resolve(this.opts.cwd, relTmpDir),
            projectId: this.args.projectId,
            projectApiToken: this.args.projectApiToken,
            platform: this.args.platform,
            scheme: this.args.scheme,
            jsOrTs: this.args.language || "ts",
            platformOptions: this.args.platform === "nextjs" ? { nextjs: { appDir: false } } : {},
        });
        await (0, exec_1.exec)(`rm -rf '${relTmpDir}/.git'`, this.opts);
        // Gatsby build breaks if we move the project directory without deleting
        // the cache. If that's fixed by Gatsby we can stop removing the cache
        // in the next line.
        await (0, exec_1.exec)(`rm -rf '${relTmpDir}/.cache'`, this.opts);
        await (0, exec_1.exec)(`shopt -s dotglob && mv * ../`, {
            ...this.opts,
            cwd: path_1.default.join(this.opts.cwd, relTmpDir),
        });
        await (0, exec_1.exec)(`rm -rf '${relTmpDir}'`, this.opts);
        return await this.commit(this.args.branch);
    }
    async updateDependencies() {
        const pm = (0, util_1.mkPackageManagerCmds)(this.opts.cwd);
        if (this.args.scheme === "loader") {
            console.log("Updating dependencies.");
            const platform = this.detectPlatform();
            if (platform) {
                await (0, exec_1.exec)(`${pm.add} @plasmicapp/loader-${platform}`, this.opts);
            }
        }
    }
    /**
     * Syncs a project in the working directory if scheme == "codegen".
     *
     * @returns {newBranch} name of created branch (if PR was requested) or
     * undefined if no new branch was created.
     */
    async sync() {
        if (this.args.scheme === "loader") {
            console.log("Nothing to sync; scheme is set to 'loader'.");
            return undefined;
        }
        const pm = (0, util_1.mkPackageManagerCmds)(this.opts.cwd);
        const newBranch = this.args.syncAction === "pr"
            ? (0, util_1.mkPrBranchName)(this.args.branch)
            : undefined;
        (0, util_1.assertNoSingleQuotes)(this.args.branch);
        if (newBranch) {
            (0, util_1.assertNoSingleQuotes)(newBranch);
        }
        (0, util_1.assertNoSingleQuotes)(this.args.projectId);
        (0, util_1.assertNoSingleQuotes)(this.args.projectApiToken);
        await (0, exec_1.exec)(`git checkout '${this.args.branch}'`, this.opts);
        if (newBranch) {
            await (0, exec_1.exec)(`git checkout -B '${newBranch}'`, this.opts);
        }
        await (0, exec_1.exec)(`${pm.add} @plasmicapp/cli`, this.opts);
        await (0, exec_1.exec)(`${pm.cmd} plasmic sync --projects '${this.args.projectId}:${this.args.projectApiToken}' --yes`, this.opts);
        return (await this.commit(newBranch || this.args.branch))
            ? newBranch
            : undefined;
    }
    /**
     * Checkouts given branch and builds project using Next.js, Gatsby or CRA
     * command depending on platform argument.
     *
     * @returns {publishDir} generated directory to publish.
     */
    async build() {
        (0, util_1.assertNoSingleQuotes)(this.args.branch);
        await (0, exec_1.exec)(`git checkout '${this.args.branch}'`, this.opts);
        if (this.args.skipIfPlasmic) {
            const { stdout: authorEmail } = await (0, exec_1.exec)(`git log -1 --pretty=format:'%ae'`, this.opts);
            if (authorEmail.trim() === gitUserEmail) {
                console.log("Skipping; last commit was made by Plasmic.");
                return "";
            }
        }
        const pm = (0, util_1.mkPackageManagerCmds)(this.opts.cwd);
        await (0, exec_1.exec)(`${pm.install}`, this.opts);
        const platform = this.args.platform || this.detectPlatform();
        let dir;
        switch (platform) {
            case "nextjs":
                await (0, exec_1.exec)(`${pm.cmd} next build`, this.opts);
                await (0, exec_1.exec)(`${pm.cmd} next export`, this.opts);
                dir = "out";
                break;
            case "gatsby":
                await (0, exec_1.exec)(`${pm.cmd} gatsby build`, this.opts);
                dir = "public";
                break;
            case "react":
                await (0, exec_1.exec)(`${pm.run} build`, this.opts);
                dir = "build/static";
                break;
            default:
                throw new Error(`Unknown platform '${platform}'`);
        }
        // A .nojekyll file is required to bypass Jekyll processing and publish
        // files and directories that start with underscores, e.g. _next.
        // https://github.blog/2009-12-29-bypassing-jekyll-on-github-pages/
        const nojekyllPath = path_1.default.join(dir, ".nojekyll");
        await (0, exec_1.exec)(`touch ${nojekyllPath}`, this.opts);
        return dir;
    }
    detectPlatform() {
        const packageJson = (0, fs_1.readFileSync)(path_1.default.join(this.opts.cwd, "package.json"), "utf8");
        const parsedPackageJson = JSON.parse(packageJson);
        if ((0, fs_1.existsSync)(path_1.default.join(this.opts.cwd, "gatsby-config.js"))) {
            return "gatsby";
        }
        if (parsedPackageJson.scripts.build === "next build" ||
            "next" in parsedPackageJson.dependencies) {
            return "nextjs";
        }
        return "react";
    }
    /**
     * Commits existing working directory and push to remote (setting branch
     * upstream).
     */
    async commit(branch) {
        if (!this.remote) {
            throw new Error("No git remote to push");
        }
        if (!this.args.title) {
            throw new Error("No commit title to use");
        }
        (0, util_1.assertNoSingleQuotes)(this.remote);
        const commitMessage = `${this.args.title}\n\n${this.args.description}`;
        await (0, exec_1.exec)(`git add -A .`, this.opts);
        await (0, exec_1.exec)(`git config user.name '${gitUserName}'`, this.opts);
        await (0, exec_1.exec)(`git config user.email '${gitUserEmail}'`, this.opts);
        const { stdout: staged } = await (0, exec_1.exec)(`git status --untracked-files=no --porcelain`, this.opts);
        if (!staged.trim()) {
            console.log("Skipping commit; no changes.");
            return false;
        }
        await (0, exec_1.exec)(`git commit -F -`, { ...this.opts, input: commitMessage });
        await (0, exec_1.exec)(`git push -u '${this.remote}' '${branch}'`, this.opts);
        return true;
    }
}
exports.PlasmicAction = PlasmicAction;
