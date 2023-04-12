import * as core from "@actions/core";
import { nanoid } from "nanoid";
import { existsSync } from "fs";
import path from "path";
import semver from "semver";
import { execSync } from "child_process";

export type Outputs = {
  synced: boolean;
  new_branch: string;
  publish_dir: string;
};

type PackageManagerCmds = {
  install: string;
  run: string;
  add: string;
  cmd: string;
};

export function assertNoSingleQuotes(str: string) {
  if (str.includes("'")) {
    throw new Error(`Invalid string (contains single quotes): ${str}`);
  }
}

export function mkPackageManagerCmds(cwd: string): PackageManagerCmds {
  // We check both cwd, and the root path (cwd may be a subdir if the user
  // specified a sub directory within a repo). This is a quick heuristics
  // for dealing with mono-repos
  const useYarn =
    existsSync(path.join(cwd, "yarn.lock")) ||
    existsSync(path.join(".", "yarn.lock"));

  if (useYarn) {
    const yarnVersion = execSync(`yarn --version`).toString().trim();
    const is2 = semver.gte(yarnVersion, "2.0.0");
    return {
      install: "yarn",
      run: "yarn",
      add: is2 ? "yarn add" : "yarn add -W",
      cmd: "yarn",
    };
  }

  return {
    install: "npm install",
    run: "npm run",
    add: "npm install",
    cmd: "npx",
  };
}

export function mkPrBranchName(targetBranch: string) {
  return `plasmicops/${nanoid(8)}/${targetBranch}`;
}

export function setOutputs(outputs: Partial<Outputs>) {
  for (const [k, v] of Object.entries(outputs)) {
    core.setOutput(k, v);
  }
}
