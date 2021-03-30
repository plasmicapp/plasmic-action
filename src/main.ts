import * as core from "@actions/core";
import {
  SyncAction,
  Language,
  Platform,
  Scheme,
  RunAction,
  PlasmicAction,
} from "./actions";
import { setOutputs } from "./util";

async function run(): Promise<void> {
  try {
    const action = new PlasmicAction({
      run: core.getInput("run") as RunAction,
      githubToken: core.getInput("github_token"),
      projectId: core.getInput("project_id"),
      projectApiToken: core.getInput("project_api_token"),
      platform: core.getInput("platform") as Platform,
      language: core.getInput("language") as Language,
      scheme: core.getInput("scheme") as Scheme,
      branch: core.getInput("branch"),
      directory: core.getInput("directory"),
      syncAction: core.getInput("sync_action") as SyncAction,
      title: core.getInput("title"),
      description: core.getInput("description"),
    });

    const outputs = await action.run();
    setOutputs(outputs);
  } catch (error) {
    core.setFailed(error.message || error);
  }
}

run();
