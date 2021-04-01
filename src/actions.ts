import { existsSync } from "fs";
import path from "path";
import { exec, ExecOptions } from "./exec";
import {
  assertNoSingleQuotes,
  mkPackageManagerCmds,
  mkPrBranchName,
  Outputs,
} from "./util";

export type RunAction = "init" | "sync" | "build";
export type Platform = "nextjs" | "gatsby" | "react" | "";
export type Language = "js" | "ts" | "";
export type Scheme = "codegen" | "loader" | "";
export type SyncAction = "commit" | "pr" | "";

const gitUserName = "Plasmic Bot";
const gitUserEmail = "ops+git@plasmic.app";

type PlasmicActionOptions = {
  run: RunAction;

  branch: string;
  directory: string;
  githubToken: string;
  syncAction: SyncAction;

  projectId: string;
  projectApiToken: string;

  platform: Platform;
  scheme: Scheme;
  language: Language;

  title: string;
  description: string;
};

export class PlasmicAction {
  private opts: ExecOptions;
  private remote?: string;

  constructor(private args: PlasmicActionOptions) {
    this.opts = {
      cwd: path.join(".", args.directory || "."),
      onOutput: (chunk: string) => console.log(chunk.trim()),
      echo: true,
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
      return false;
    }

    assertNoSingleQuotes(this.args.branch);
    assertNoSingleQuotes(this.args.platform);
    assertNoSingleQuotes(this.args.scheme);
    assertNoSingleQuotes(this.args.projectId);
    assertNoSingleQuotes(this.args.projectApiToken);

    await exec(`git checkout '${this.args.branch}'`, this.opts);

    const relTmpDir = "tmp-cpa";
    await exec(
      `npx create-plasmic-app --platform '${this.args.platform}' --scheme '${
        this.args.scheme
      }' ${this.args.language === "ts" ? "--typescript" : ""} --projectId '${
        this.args.projectId
      }' --projectApiToken '${this.args.projectApiToken}' '${relTmpDir}'`,
      this.opts
    );
    await exec(`rm -rf '${relTmpDir}/.git'`, this.opts);
    await exec(`shopt -s dotglob && mv * ../`, {
      ...this.opts,
      cwd: path.join(this.opts.cwd, relTmpDir),
    });
    await exec(`rm -rf '${relTmpDir}'`, this.opts);
    await this.commit(this.args.branch);
    return true;
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
    await this.commit(newBranch || this.args.branch);
    return newBranch;
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
    const pm = mkPackageManagerCmds(this.opts.cwd);
    await exec(`${pm.install}`, this.opts);
    switch (this.args.platform) {
      case "nextjs":
        await exec(`${pm.cmd} next build`, this.opts);
        await exec(`${pm.cmd} next export`, this.opts);
        return "out";
      case "gatsby":
        await exec(`${pm.cmd} gatsby build`, this.opts);
        return "public";
      case "react":
        await exec(`${pm.run} build`, this.opts);
        return "build/static";
      default:
        throw new Error(`Unknown platform '${this.args.platform}'`);
    }
  }

  /**
   * Commits existing working directory and push to remote (setting branch
   * upstream).
   */
  async commit(branch: string): Promise<void> {
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
    await exec(`git commit -F -`, { ...this.opts, input: commitMessage });
    await exec(`git push -u '${this.remote}' '${branch}'`, this.opts);
  }
}
