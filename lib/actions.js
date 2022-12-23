"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (this.args.run) {
                case "init":
                    const synced = yield this.init();
                    return { synced };
                case "sync":
                    const new_branch = yield this.sync();
                    return { new_branch };
                case "build":
                    const publish_dir = yield this.build();
                    return { publish_dir };
                default:
                    throw new Error(`Unknown run action: ${this.args.run}`);
            }
        });
    }
    /**
     * Detects if there is a project in the working directory (by testing
     * package.json existence). If there isn't, use create-plasmic-app to
     * create a new one.
     *
     * @returns {synced} boolean indicating whether projectId was synced or not.
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const isNewApp = !fs_1.existsSync(path_1.default.join(this.opts.cwd, "package.json"));
            if (!isNewApp) {
                console.log("Detected existing app. Moving forward...");
                yield this.updateDependencies();
                return false;
            }
            util_1.assertNoSingleQuotes(this.args.branch);
            util_1.assertNoSingleQuotes(this.args.platform);
            util_1.assertNoSingleQuotes(this.args.scheme);
            util_1.assertNoSingleQuotes(this.args.projectId);
            util_1.assertNoSingleQuotes(this.args.projectApiToken);
            if (this.args.platform === "" || this.args.scheme === "") {
                throw new Error("Platform and scheme must be specified.");
            }
            yield exec_1.exec(`git checkout '${this.args.branch}'`, this.opts);
            create_plasmic_app_1.setMetadata({
                source: "plasmic-action",
            });
            const relTmpDir = "tmp-cpa";
            yield create_plasmic_app_1.create({
                resolvedProjectPath: path_1.default.resolve(this.opts.cwd, relTmpDir),
                projectId: this.args.projectId,
                projectApiToken: this.args.projectApiToken,
                platform: this.args.platform,
                scheme: this.args.scheme,
                useTypescript: this.args.language === "ts",
            });
            yield exec_1.exec(`rm -rf '${relTmpDir}/.git'`, this.opts);
            // Gatsby build breaks if we move the project directory without deleting
            // the cache. If that's fixed by Gatsby we can stop removing the cache
            // in the next line.
            yield exec_1.exec(`rm -rf '${relTmpDir}/.cache'`, this.opts);
            yield exec_1.exec(`shopt -s dotglob && mv * ../`, Object.assign(Object.assign({}, this.opts), { cwd: path_1.default.join(this.opts.cwd, relTmpDir) }));
            yield exec_1.exec(`rm -rf '${relTmpDir}'`, this.opts);
            return yield this.commit(this.args.branch);
        });
    }
    updateDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            const pm = util_1.mkPackageManagerCmds(this.opts.cwd);
            if (this.args.scheme === "loader") {
                console.log("Updating dependencies.");
                const platform = this.detectPlatform();
                if (platform) {
                    yield exec_1.exec(`${pm.add} @plasmicapp/loader-${platform}`, this.opts);
                }
            }
        });
    }
    /**
     * Syncs a project in the working directory if scheme == "codegen".
     *
     * @returns {newBranch} name of created branch (if PR was requested) or
     * undefined if no new branch was created.
     */
    sync() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.args.scheme === "loader") {
                console.log("Nothing to sync; scheme is set to 'loader'.");
                return undefined;
            }
            const pm = util_1.mkPackageManagerCmds(this.opts.cwd);
            const newBranch = this.args.syncAction === "pr"
                ? util_1.mkPrBranchName(this.args.branch)
                : undefined;
            util_1.assertNoSingleQuotes(this.args.branch);
            if (newBranch) {
                util_1.assertNoSingleQuotes(newBranch);
            }
            util_1.assertNoSingleQuotes(this.args.projectId);
            util_1.assertNoSingleQuotes(this.args.projectApiToken);
            yield exec_1.exec(`git checkout '${this.args.branch}'`, this.opts);
            if (newBranch) {
                yield exec_1.exec(`git checkout -B '${newBranch}'`, this.opts);
            }
            yield exec_1.exec(`${pm.add} @plasmicapp/cli`, this.opts);
            yield exec_1.exec(`${pm.cmd} plasmic sync --projects '${this.args.projectId}:${this.args.projectApiToken}' --yes`, this.opts);
            const localizedStrings = (_a = this.args.localizedStrings) === null || _a === void 0 ? void 0 : _a.match(/[\w\d\/._-]+\.([\w]+)$/);
            if (localizedStrings) {
                const [path, ext] = localizedStrings;
                yield exec_1.exec(`rm -f ${path}`, this.opts);
                yield exec_1.exec(`${pm.cmd} plasmic localization-strings --format ${ext} -o ${path} --projects '${this.args.projectId}' --yes`, this.opts);
                yield exec_1.exec(`git add -f ${path}`, this.opts);
            }
            return (yield this.commit(newBranch || this.args.branch))
                ? newBranch
                : undefined;
        });
    }
    /**
     * Checkouts given branch and builds project using Next.js, Gatsby or CRA
     * command depending on platform argument.
     *
     * @returns {publishDir} generated directory to publish.
     */
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            util_1.assertNoSingleQuotes(this.args.branch);
            yield exec_1.exec(`git checkout '${this.args.branch}'`, this.opts);
            if (this.args.skipIfPlasmic) {
                const { stdout: authorEmail } = yield exec_1.exec(`git log -1 --pretty=format:'%ae'`, this.opts);
                if (authorEmail.trim() === gitUserEmail) {
                    console.log("Skipping; last commit was made by Plasmic.");
                    return "";
                }
            }
            const pm = util_1.mkPackageManagerCmds(this.opts.cwd);
            yield exec_1.exec(`${pm.install}`, this.opts);
            const platform = this.args.platform || this.detectPlatform();
            let dir;
            switch (platform) {
                case "nextjs":
                    yield exec_1.exec(`${pm.cmd} next build`, this.opts);
                    yield exec_1.exec(`${pm.cmd} next export`, this.opts);
                    dir = "out";
                    break;
                case "gatsby":
                    yield exec_1.exec(`${pm.cmd} gatsby build`, this.opts);
                    dir = "public";
                    break;
                case "react":
                    yield exec_1.exec(`${pm.run} build`, this.opts);
                    dir = "build/static";
                    break;
                default:
                    throw new Error(`Unknown platform '${platform}'`);
            }
            // A .nojekyll file is required to bypass Jekyll processing and publish
            // files and directories that start with underscores, e.g. _next.
            // https://github.blog/2009-12-29-bypassing-jekyll-on-github-pages/
            const nojekyllPath = path_1.default.join(dir, ".nojekyll");
            yield exec_1.exec(`touch ${nojekyllPath}`, this.opts);
            return dir;
        });
    }
    detectPlatform() {
        const packageJson = fs_1.readFileSync(path_1.default.join(this.opts.cwd, "package.json"), "utf8");
        const parsedPackageJson = JSON.parse(packageJson);
        if (fs_1.existsSync(path_1.default.join(this.opts.cwd, "gatsby-config.js"))) {
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
    commit(branch) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.remote) {
                throw new Error("No git remote to push");
            }
            if (!this.args.title) {
                throw new Error("No commit title to use");
            }
            util_1.assertNoSingleQuotes(this.remote);
            const commitMessage = `${this.args.title}\n\n${this.args.description}`;
            yield exec_1.exec(`git add -A .`, this.opts);
            yield exec_1.exec(`git config user.name '${gitUserName}'`, this.opts);
            yield exec_1.exec(`git config user.email '${gitUserEmail}'`, this.opts);
            const { stdout: staged } = yield exec_1.exec(`git status --untracked-files=no --porcelain`, this.opts);
            if (!staged.trim()) {
                console.log("Skipping commit; no changes.");
                return false;
            }
            yield exec_1.exec(`git commit -F -`, Object.assign(Object.assign({}, this.opts), { input: commitMessage }));
            yield exec_1.exec(`git push -u '${this.remote}' '${branch}'`, this.opts);
            return true;
        });
    }
}
exports.PlasmicAction = PlasmicAction;
