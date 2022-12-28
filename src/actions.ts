import { existsSync, readFileSync } from "fs";
import path from "path";
import { exec, ExecOptions } from "./exec";
import {
  assertNoSingleQuotes,
  mkPackageManagerCmds,
  mkPrBranchName,
  Outputs,
} from "./util";
import { create, setMetadata } from "create-plasmic-app";

export type RunAction = "init" | "sync" | "build";
export type Platform = "nextjs" | "gatsby" | "react" | "";
export type Language = "js" | "ts" | "";
export type Scheme = "codegen" | "loader" | "";
export type SyncAction = "commit" | "pr" | "";
export type LocalizationStringsFormat = "po" | "json" | "lingui" | "";

const gitUserName = "Plasmic Bot";
const gitUserEmail = "ops+git@plasmic.app";

export type PlasmicActionOptions = {
  run: RunAction;

  branch: string;
  directory: string;
  githubToken: string;
  syncAction: SyncAction;

  localizationStringsPath: string;
  localizationStringsFormat: LocalizationStringsFormat;

  projectId: string;
  projectApiToken: string;

  platform: Platform;
  scheme: Scheme;
  language: Language;

  title: string;
  description: string;

  skipIfPlasmic: boolean;
};

export class PlasmicAction {
  private opts: ExecOptions;
  private remote?: string;

  constructor(private args: PlasmicActionOptions) {
    this.opts = {
      cwd: path.join(".", args.directory || "."),
      shell: "bash",
    };

    this.remote = args.githubToken
      ? `https://x-access-token:${args.githubToken}@github.com/${process.env["GITHUB_REPOSITORY"]}.git`
      : undefined;
  }

  async run(): Promise<Partial<Outputs>> {
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
  async init(): Promise<boolean> {
    const isNewApp = !existsSync(path.join(this.opts.cwd, "package.json"));
    if (!isNewApp) {
      console.log("Detected existing app. Moving forward...");
      await this.updateDependencies();
      return false;
    }

    assertNoSingleQuotes(this.args.branch);
    assertNoSingleQuotes(this.args.platform);
    assertNoSingleQuotes(this.args.scheme);
    assertNoSingleQuotes(this.args.projectId);
    assertNoSingleQuotes(this.args.projectApiToken);

    if (this.args.platform === "" || this.args.scheme === "") {
      throw new Error("Platform and scheme must be specified.");
    }

    await exec(`git checkout '${this.args.branch}'`, this.opts);

    setMetadata({
      source: "plasmic-action",
    });
    const relTmpDir = "tmp-cpa";
    await create({
      resolvedProjectPath: path.resolve(this.opts.cwd, relTmpDir),
      projectId: this.args.projectId,
      projectApiToken: this.args.projectApiToken,
      platform: this.args.platform,
      scheme: this.args.scheme,
      useTypescript: this.args.language === "ts",
    });
    await exec(`rm -rf '${relTmpDir}/.git'`, this.opts);

    // Gatsby build breaks if we move the project directory without deleting
    // the cache. If that's fixed by Gatsby we can stop removing the cache
    // in the next line.
    await exec(`rm -rf '${relTmpDir}/.cache'`, this.opts);

    await exec(`shopt -s dotglob && mv * ../`, {
      ...this.opts,
      cwd: path.join(this.opts.cwd, relTmpDir),
    });
    await exec(`rm -rf '${relTmpDir}'`, this.opts);
    return await this.commit(this.args.branch);
  }

  async updateDependencies(): Promise<void> {
    const pm = mkPackageManagerCmds(this.opts.cwd);
    if (this.args.scheme === "loader") {
      console.log("Updating dependencies.");
      const platform = this.detectPlatform();
      if (platform) {
        await exec(`${pm.add} @plasmicapp/loader-${platform}`, this.opts);
      }
    }
  }

  /**
   * Syncs a project in the working directory if scheme == "codegen".
   *
   * @returns {newBranch} name of created branch (if PR was requested) or
   * undefined if no new branch was created.
   */
  async sync(): Promise<string | undefined> {
    if (this.args.scheme === "loader") {
      console.log("Nothing to sync; scheme is set to 'loader'.");
      return undefined;
    }

    const pm = mkPackageManagerCmds(this.opts.cwd);
    const newBranch =
      this.args.syncAction === "pr"
        ? mkPrBranchName(this.args.branch)
        : undefined;

    assertNoSingleQuotes(this.args.branch);
    if (newBranch) {
      assertNoSingleQuotes(newBranch);
    }
    assertNoSingleQuotes(this.args.projectId);
    assertNoSingleQuotes(this.args.projectApiToken);

    await exec(`git checkout '${this.args.branch}'`, this.opts);
    if (newBranch) {
      await exec(`git checkout -B '${newBranch}'`, this.opts);
    }
    await exec(`${pm.add} @plasmicapp/cli`, this.opts);
    await exec(
      `${pm.cmd} plasmic sync --projects '${this.args.projectId}:${this.args.projectApiToken}' --yes`,
      this.opts
    );
    const localizationStringsPath = this.args.localizationStringsPath?.match(
      /^[\w\d\/._-]+\.([\w]+)$/
    );
    if (localizationStringsPath) {
      const [path, ext] = localizationStringsPath;
      const format = this.args.localizationStringsFormat || ext;
      await exec(`rm -f ${path}`, this.opts);
      await exec(
        `${pm.cmd} plasmic localization-strings --format ${format} -o ${path} --projects '${this.args.projectId}' --yes`,
        this.opts
      );
      await exec(`git add -f ${path}`, this.opts);
    }
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
  async build(): Promise<string> {
    assertNoSingleQuotes(this.args.branch);
    await exec(`git checkout '${this.args.branch}'`, this.opts);
    if (this.args.skipIfPlasmic) {
      const { stdout: authorEmail } = await exec(
        `git log -1 --pretty=format:'%ae'`,
        this.opts
      );
      if (authorEmail.trim() === gitUserEmail) {
        console.log("Skipping; last commit was made by Plasmic.");
        return "";
      }
    }

    const pm = mkPackageManagerCmds(this.opts.cwd);
    await exec(`${pm.install}`, this.opts);

    const platform = this.args.platform || this.detectPlatform();
    let dir: string;
    switch (platform) {
      case "nextjs":
        await exec(`${pm.cmd} next build`, this.opts);
        await exec(`${pm.cmd} next export`, this.opts);
        dir = "out";
        break;
      case "gatsby":
        await exec(`${pm.cmd} gatsby build`, this.opts);
        dir = "public";
        break;
      case "react":
        await exec(`${pm.run} build`, this.opts);
        dir = "build/static";
        break;
      default:
        throw new Error(`Unknown platform '${platform}'`);
    }

    // A .nojekyll file is required to bypass Jekyll processing and publish
    // files and directories that start with underscores, e.g. _next.
    // https://github.blog/2009-12-29-bypassing-jekyll-on-github-pages/
    const nojekyllPath = path.join(dir, ".nojekyll");
    await exec(`touch ${nojekyllPath}`, this.opts);

    return dir;
  }

  detectPlatform(): Platform {
    const packageJson = readFileSync(
      path.join(this.opts.cwd, "package.json"),
      "utf8"
    );
    const parsedPackageJson = JSON.parse(packageJson);

    if (existsSync(path.join(this.opts.cwd, "gatsby-config.js"))) {
      return "gatsby";
    }

    if (
      parsedPackageJson.scripts.build === "next build" ||
      "next" in parsedPackageJson.dependencies
    ) {
      return "nextjs";
    }

    return "react";
  }

  /**
   * Commits existing working directory and push to remote (setting branch
   * upstream).
   */
  async commit(branch: string): Promise<boolean> {
    if (!this.remote) {
      throw new Error("No git remote to push");
    }
    if (!this.args.title) {
      throw new Error("No commit title to use");
    }
    assertNoSingleQuotes(this.remote);
    const commitMessage = `${this.args.title}\n\n${this.args.description}`;
    await exec(`git add -A .`, this.opts);
    await exec(`git config user.name '${gitUserName}'`, this.opts);
    await exec(`git config user.email '${gitUserEmail}'`, this.opts);

    const { stdout: staged } = await exec(
      `git status --untracked-files=no --porcelain`,
      this.opts
    );
    if (!staged.trim()) {
      console.log("Skipping commit; no changes.");
      return false;
    }

    await exec(`git commit -F -`, { ...this.opts, input: commitMessage });
    await exec(`git push -u '${this.remote}' '${branch}'`, this.opts);
    return true;
  }
}
